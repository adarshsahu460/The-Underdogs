const path = require('path');
const os = require('os');
const fs = require('fs');
const fsp = require('fs/promises');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const simpleGit = require('simple-git');
const prisma = require('../models/db');
const config = require('../config');
const { uploadBuffer } = require('./storageService');
const { analyzeContributionDiff } = require('./aiService');

const IGNORE_DIRS = new Set(['__MACOSX', '_MACOSX']);
const IGNORE_FILES = new Set(['.DS_Store']);

function nowIso() { return new Date().toISOString(); }

function normalizeNextSteps(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val.join('\n');
  if (typeof val === 'string') return val;
  return JSON.stringify(val); // fallback
}

function buildError(code, message, status = 400, extra = {}) {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  Object.assign(err, extra);
  return err;
}

async function cloneProjectRepo(project) {
  const fullName = project.botRepoFullName || (project.repoUrl && project.repoUrl.replace('https://github.com/', '').replace(/\.git$/, ''));
  if (!fullName) return null;
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'udg_src_'));
  const remote = `https://github.com/${fullName}.git`;
  const git = simpleGit({ baseDir: tmpDir });
  try {
    await git.clone(remote, tmpDir);
    const commit = await git.revparse(['HEAD']);
    // Remove .git for shipping source
    await fsp.rm(path.join(tmpDir, '.git'), { recursive: true, force: true });
    return { dir: tmpDir, commit };
  } catch (e) {
    // Fallback: no repo export
    return null;
  }
}

async function zipDirectory(rootDir, manifest) {
  const zip = new AdmZip();
  const addDir = async (dir, rel='') => {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (IGNORE_DIRS.has(e.name) || IGNORE_FILES.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      const zPath = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        await addDir(abs, zPath);
      } else if (e.isFile()) {
        const data = await fsp.readFile(abs);
        zip.addFile(zPath, data);
      }
    }
  };
  if (rootDir) await addDir(rootDir);
  zip.addFile('.underdogs/manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
  return zip.toBuffer();
}

async function createDownloadSession({ projectId, userId }) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw buildError('PROJECT_NOT_FOUND', 'Project not found', 404);
  const repoData = await cloneProjectRepo(project);
  const baseCommit = repoData?.commit || project.latestCommit || `base_${project.id}`;
  const idempotencyKey = crypto.randomUUID();
  const session = await prisma.contributionSession.create({
    data: { projectId, contributorUserId: userId || null, baseCommit, idempotencyKey }
  });
  const manifest = { schemaVersion: 1, projectId, sessionId: session.id, idempotencyKey, baseCommit, issuedAt: nowIso() };
  const buffer = await zipDirectory(repoData?.dir, manifest);
  return { buffer, filename: `project-${projectId}-contribute.zip`, meta: { sessionId: session.id, idempotencyKey, baseCommit } };
}

function extractManifestVerbose(buffer) {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const candidates = [];
  for (const e of entries) {
    if (e.isDirectory) continue;
    let name = e.entryName.replace(/\\/g,'/');
    if (name.startsWith('__MACOSX')) continue;
    if (/(^|\/)(\.underdogs|\.UNDERDOGS)\/manifest\.json$/i.test(name)) {
      candidates.push(e);
    }
  }
  if (candidates.length === 0) {
    return { manifest: null, location: null, diagnostics: {
      topLevel: Array.from(new Set(entries.map(en => en.entryName.split('/')[0]).filter(x => x && x !== '__MACOSX'))),
      count: entries.length
    }};
  }
  if (candidates.length > 1) {
    return { manifest: null, location: null, multiple: true, candidates: candidates.map(c => c.entryName) };
  }
  const entry = candidates[0];
  try {
    const manifest = JSON.parse(entry.getData().toString('utf8'));
    return { manifest, location: entry.entryName };
  } catch (e) {
    return { manifest: null, location: entry.entryName, parseError: e.message };
  }
}

async function extractZipToTemp(buffer) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'udg_up_'));
  const zip = new AdmZip(buffer);
  for (const e of zip.getEntries()) {
    const name = e.entryName;
    if (name.includes('..')) continue; // traversal block
    if (name.startsWith('__MACOSX') || name.startsWith('_MACOSX')) continue;
    if (path.basename(name) === '.DS_Store') continue;
    if (e.isDirectory) continue;
    const outPath = path.join(tempRoot, name);
    await fsp.mkdir(path.dirname(outPath), { recursive: true });
    await fsp.writeFile(outPath, e.getData());
  }
  // Determine root folder heuristic
  const entries = await fsp.readdir(tempRoot, { withFileTypes: true });
  const dirs = entries.filter(d => d.isDirectory() && !IGNORE_DIRS.has(d.name)).map(d => d.name);
  const realFiles = entries.filter(f => f.isFile() && !IGNORE_FILES.has(f.name));
  let root = tempRoot;
  if (dirs.length === 1 && realFiles.length === 0) {
    root = path.join(tempRoot, dirs[0]);
  }
  return { tempRoot, rootDir: root };
}

async function processUpload({ projectId, buffer, userId }) {
  if (!buffer || !buffer.length) throw buildError('EMPTY_FILE', 'Uploaded file empty');
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw buildError('PROJECT_NOT_FOUND', 'Project not found', 404);

  // Locate existing session by (projectId, idempotencyKey)
  // Parse manifest
  const { manifest, location, diagnostics, multiple, candidates, parseError } = extractManifestVerbose(buffer);
  if (multiple) throw buildError('MANIFEST_MULTIPLE', 'Multiple manifest files found', 400, { candidates });
  if (parseError) throw buildError('MANIFEST_INVALID', 'Manifest JSON parse error', 400, { location, parseError });
  if (!manifest) throw buildError('MANIFEST_MISSING', 'Contribution manifest missing', 400, { diagnostics });
  if (manifest.projectId !== projectId) throw buildError('PROJECT_ID_MISMATCH', 'Manifest projectId mismatch');
  const idemKey = manifest.idempotencyKey || manifest.sessionId || manifest.baseCommit;
  if (!idemKey) throw buildError('IDEMPOTENCY_KEY_MISSING', 'Manifest missing idempotencyKey');

  // Locate existing session by manifest idempotency key
  let session = await prisma.contributionSession.findFirst({ where: { projectId, idempotencyKey: idemKey }, include: { resultContribution: true } });

  if (!session) {
    session = await prisma.contributionSession.create({
      data: {
        id: manifest.sessionId,
        projectId,
        idempotencyKey: idemKey,
        baseCommit: manifest.baseCommit,
        contributorUserId: userId || null,
        manifestVersion: manifest.schemaVersion || 1,
        status: 'UPLOADED'
      },
      include: { resultContribution: true }
    });
  }

  if (session.status === 'FINAL' && session.resultContribution) {
    return { idempotencyStatus: 'replay', contribution: session.resultContribution };
  }

  if (session.baseCommit !== manifest.baseCommit) {
    throw buildError('BASE_COMMIT_STALE', 'Base commit mismatch', 409);
  }

  // Store original archive
  const key = `contributions/${projectId}/${session.id}/upload.zip`;
  await uploadBuffer(key, buffer, 'application/zip');

  // Extract & push as a new commit to main
  const { rootDir } = await extractZipToTemp(buffer);
  const fullName = project.botRepoFullName || (project.repoUrl && project.repoUrl.replace('https://github.com/', '').replace(/\.git$/, ''));
  if (!fullName) throw buildError('NO_REPO', 'Project repository not configured');
  let diffText = '';
  let headCommit = '';
  let baseCommitReal = '';
  try {
  const remote = `https://github.com/${fullName}.git`;
  const workDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'udg_commit_'));
  const git = simpleGit({ baseDir: workDir });
  await git.clone(remote, workDir, ['--depth','50']);
    baseCommitReal = await git.revparse(['HEAD']);

    // Differential sync instead of destructive wipe to avoid false diffs for identical uploads
    const listFiles = async (dir, relBase = '') => {
      const out = [];
      const ents = await fsp.readdir(dir, { withFileTypes: true });
      for (const ent of ents) {
        if (IGNORE_DIRS.has(ent.name) || IGNORE_FILES.has(ent.name)) continue;
        if (ent.name === '.underdogs') continue;
        const abs = path.join(dir, ent.name);
        const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
        if (ent.isDirectory()) {
          out.push(...(await listFiles(abs, rel)));
        } else if (ent.isFile()) {
          out.push(rel);
        }
      }
      return out;
    };

    const newFiles = new Set(await listFiles(rootDir));

    // Remove files in repo not present in new upload
    const removeExtraneous = async (dir, relBase='') => {
      const ents = await fsp.readdir(dir, { withFileTypes: true });
      for (const ent of ents) {
        if (ent.name === '.git') continue;
        if (IGNORE_DIRS.has(ent.name) || IGNORE_FILES.has(ent.name)) continue;
        if (ent.name === '.underdogs') continue;
        const abs = path.join(dir, ent.name);
        const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
        if (ent.isDirectory()) {
          await removeExtraneous(abs, rel);
          // Clean up dir if empty afterwards (optional)
          try {
            const remain = await fsp.readdir(abs);
            if (!remain.length) await fsp.rmdir(abs);
          } catch {/* ignore */}
        } else if (ent.isFile()) {
          if (!newFiles.has(rel)) {
            await fsp.rm(abs, { force: true });
          }
        }
      }
    };
    await removeExtraneous(workDir);

    // Copy / overwrite new files
    const copyIn = async (src, dest) => {
      const ents = await fsp.readdir(src, { withFileTypes: true });
      for (const ent of ents) {
        if (IGNORE_DIRS.has(ent.name) || IGNORE_FILES.has(ent.name)) continue;
        if (ent.name === '.underdogs') continue;
        const s = path.join(src, ent.name);
        const d = path.join(dest, ent.name);
        if (ent.isDirectory()) {
          await fsp.mkdir(d, { recursive: true });
          await copyIn(s, d);
        } else if (ent.isFile()) {
          // Overwrite; git will detect unchanged content and ignore
            await fsp.mkdir(path.dirname(d), { recursive: true });
          await fsp.copyFile(s, d);
        }
      }
    };
    await copyIn(rootDir, workDir);
    await git.add(['-A']);
    const commitMsg = `Contribution session ${session.id || idemKey}`;
    // Only commit if there are staged changes
    const status = await git.status();
    if (status.staged.length === 0 && status.modified.length === 0 && status.created.length === 0 && status.deleted.length === 0) {
      diffText = '# No changes detected (nothing to commit).';
      headCommit = baseCommitReal;
    } else {
      await git.commit(commitMsg);
      headCommit = await git.revparse(['HEAD']);
      diffText = await git.diff([`${baseCommitReal}..${headCommit}`]);
      if (!diffText.trim()) diffText = '# Empty diff (content identical).';
      // Push with token
      const authedRemote = `https://x-access-token:${config.github.token}@github.com/${fullName}.git`;
      await git.addRemote('origin-authed', authedRemote).catch(()=>{});
      await git.push(['origin-authed', config.github.defaultBranch || 'main']);
    }
  } catch (e) {
    diffText = `# Commit push failed: ${e.message}`;
    headCommit = baseCommitReal || session.baseCommit || 'unknown';
  }
  // Use the real base commit for diff context if available
  session.baseCommit = session.baseCommit || baseCommitReal;
  const truncatedDiff = diffText.slice(0, config.contributions.diffMaxChars);

  // AI analysis
  let analysis = null;
  try {
    analysis = await analyzeContributionDiff({
      diff: truncatedDiff,
      previousSummary: project.aiSummary || '',
      projectTitle: project.title || project.name || 'Project'
    });
  } catch (e) {
    analysis = { contributionSummary: null, updatedProjectSummary: project.aiSummary || null, nextSteps: null, raw: { error: e.message } };
  }

  const previousSummary = project.aiSummary || null;
  // Ensure updated project summary is stored as a string (DB column is String?)
  let updatedProjectSummary = analysis.updatedProjectSummary || previousSummary;
  if (updatedProjectSummary && typeof updatedProjectSummary !== 'string') {
    try { updatedProjectSummary = JSON.stringify(updatedProjectSummary); } catch { updatedProjectSummary = String(updatedProjectSummary); }
  }

  const result = await prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.create({
      data: {
        projectId,
        contributorUserId: session.contributorUserId,
  baseCommit: session.baseCommit,
        headCommit,
        diffTruncated: truncatedDiff,
        diffSize: diffText.length,
        aiContributionSummary: analysis.contributionSummary,
        aiNextSteps: normalizeNextSteps(analysis.nextSteps),
        aiUpdatedProjectSummary: updatedProjectSummary
      }
    });
  await tx.projectSummarySnapshot.create({ data: { projectId, contributionId: contribution.id, previousSummary, newSummary: updatedProjectSummary } });
  await tx.project.update({ where: { id: projectId }, data: { aiSummary: updatedProjectSummary, aiNextSteps: normalizeNextSteps(analysis.nextSteps) || project.aiNextSteps, aiLastGeneratedAt: new Date() } });
    await tx.contributionSession.update({ where: { id: session.id }, data: { resultContributionId: contribution.id, status: 'FINAL', archiveObjectKey: key } });
    return contribution;
  });

  return { idempotencyStatus: session.status === 'FINAL' ? 'replay' : 'created', contribution: result };
}

async function getTimeline(projectId) {
  return prisma.contribution.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' }, select: { id: true, createdAt: true, contributorUserId: true, aiContributionSummary: true, aiNextSteps: true, baseCommit: true, headCommit: true } });
}

module.exports = { createDownloadSession, processUpload, getTimeline };
