const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const tmp = require('tmp');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const db = require('../models/db');
const config = require('../config');
const { uploadBuffer } = require('../services/storageService');
const { pushProjectDirectory, forkRepo } = require('../services/githubService');
const { requestAnalysis } = require('../services/aiService');

function listProjects(req, res) {
  const rows = db.prepare('SELECT id, title, description, bot_repo_full_name, ai_summary, keywords, created_at FROM projects ORDER BY id DESC').all();
  res.json({ projects: rows });
}

async function uploadZip(req, res) {
  if (!req.file) return res.status(400).json({ error: 'ZIP file required (field "file")' });
  // Save file to storage (S3/local)
  const key = `uploads/${Date.now()}_${req.file.originalname}`;
  await uploadBuffer(key, req.file.buffer, req.file.mimetype);

  // Unzip to temp dir
  const tempDir = tmp.dirSync({ unsafeCleanup: true }).name;
  const zipPath = path.join(tempDir, 'upload.zip');
  await fs.promises.writeFile(zipPath, req.file.buffer);
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(tempDir, true);

  // Determine repo name: userId_projectIdRandom later; for initial push: userId_<random>
  const random = crypto.randomBytes(3).toString('hex');
  const repoName = `${req.user.id}_${random}`;
  const fullName = await pushProjectDirectory(tempDir, repoName);

  const info = db.prepare('INSERT INTO projects (owner_user_id, bot_repo_full_name, title) VALUES (?,?,?)')
    .run(req.user.id, fullName, req.file.originalname.replace(/\.zip$/i,'').slice(0,80));
  res.json({ projectId: info.lastInsertRowid, repo: fullName });
}

async function uploadGitHubUrl(req, res) {
  const { url, title } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  // Clone public repo into temp then push into bot org namespace
  const tempDir = tmp.dirSync({ unsafeCleanup: true }).name;
  const git = require('simple-git')({ baseDir: tempDir });
  await git.clone(url, tempDir);
  // Remove existing .git to re-init
  await fs.promises.rm(path.join(tempDir, '.git'), { recursive: true, force: true });
  const repoName = `${req.user.id}_${crypto.randomBytes(3).toString('hex')}`;
  const fullName = await pushProjectDirectory(tempDir, repoName);
  const info = db.prepare('INSERT INTO projects (owner_user_id, original_repo_url, bot_repo_full_name, title) VALUES (?,?,?,?)')
    .run(req.user.id, url, fullName, title || repoName);
  res.json({ projectId: info.lastInsertRowid, repo: fullName });
}

// Helper to stream S3 body to buffer
async function streamToBuffer(stream) {
  if (Buffer.isBuffer(stream)) return stream;
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', d => chunks.push(d));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function parseS3ObjectUrl(url) {
  if (url.startsWith('s3://')) {
    const noProto = url.slice(5);
    const idx = noProto.indexOf('/');
    return { bucket: noProto.slice(0, idx), key: noProto.slice(idx + 1) };
  }
  try {
    const u = new URL(url);
    const host = u.hostname.split('.');
    // virtual-hosted style bucket.s3.region.amazonaws.com / bucket.s3.amazonaws.com / bucket.s3-accelerate.amazonaws.com
    if (host.length >= 3 && host[1].startsWith('s3')) {
      return { bucket: host[0], key: u.pathname.replace(/^\//,'') };
    }
    // path style s3.region.amazonaws.com/bucket/key
    if (host[0].startsWith('s3')) {
      const parts = u.pathname.replace(/^\//,'').split('/');
      const bucket = parts.shift();
      return { bucket, key: parts.join('/') };
    }
  } catch (e) { /* ignore */ }
  throw new Error('Unrecognized S3 object URL');
}

async function fetchUrlToBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function uploadS3Zip(req, res) {
  const body = req.body || {};
  const s3Url = body.projectFileUrl || body.s3Url;
  if (!s3Url) return res.status(400).json({ error: 'projectFileUrl required' });
  if (!/\.zip($|\?)/i.test(s3Url)) return res.status(400).json({ error: 'URL must reference a .zip' });
  // Auth optional: fall back to anonymous user id 0 if not provided
  const userId = (req.user && req.user.id) || db.anonymousUserId;
  let parsed;
  try { parsed = parseS3ObjectUrl(s3Url); } catch (e) { return res.status(400).json({ error: e.message }); }
  const region = config.s3.region || process.env.S3_REGION;
  // Explicitly provide credentials because we use custom env var names (S3_ACCESS_KEY_ID, etc.)
  // The AWS SDK default provider chain expects AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY, so without this
  // it throws CredentialsProviderError.
  const hasCreds = !!(config.s3.accessKeyId && config.s3.secretAccessKey);
  const isPresigned = /[?&]X-Amz-Signature=/i.test(s3Url) || /[?&]X-Amz-Credential=/i.test(s3Url);
  let s3Client = null;
  if (hasCreds) {
    s3Client = new S3Client({
      region,
      endpoint: config.s3.endpoint || undefined,
      forcePathStyle: config.s3.forcePathStyle,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey
      }
    });
  } else if (!isPresigned) {
    // We have neither credentials nor a presigned URL -> cannot proceed.
    return res.status(500).json({ error: 'Server lacks S3 credentials and URL is not presigned' });
  }
  try {
    let zipBuffer;
    if (isPresigned) {
      // Direct HTTPS download of the presigned URL (does not need credentials)
      zipBuffer = await fetchUrlToBuffer(s3Url);
    } else {
      // Download via AWS SDK using provided credentials
      const obj = await s3Client.send(new GetObjectCommand({ Bucket: parsed.bucket, Key: parsed.key }));
      zipBuffer = await streamToBuffer(obj.Body);
    }
    // Extract
    const tempDir = tmp.dirSync({ unsafeCleanup: true }).name;
    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(tempDir, true);
    // Repo naming
  const repoName = `${(req.user && req.user.id) ? req.user.id : 'anon'}_${crypto.randomBytes(3).toString('hex')}`;
    const fullName = await pushProjectDirectory(tempDir, repoName);
    // Insert project metadata
    const insert = db.prepare(`INSERT INTO projects (
      owner_user_id, original_repo_url, bot_repo_full_name, title, description, category, languages,
      reason_halted, documentation_url, demo_url, s3_object_key, s3_object_url, source_type
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const languagesVal = Array.isArray(body.languages)
      ? JSON.stringify(body.languages)
      : (body.languages ? JSON.stringify([body.languages]) : null);
    const projectRow = insert.run(
  userId,
      s3Url,
      fullName,
      (body.title || repoName).slice(0,80),
      body.description || null,
      body.category || null,
      languagesVal,
      body.reasonHalted || null,
      body.documentation || body.documentationUrl || null,
      body.demo || body.demoUrl || null,
      body.projectFileKey || parsed.key,
      s3Url,
      's3_zip'
    );
    // Optional AI
    let report = null;
    const analyze = body.analyze !== undefined ? !!body.analyze : true;
    if (analyze) {
      try {
        report = await requestAnalysis(fullName);
        const summary = report.summary || null;
        const keywords = Array.isArray(report.keywords) ? report.keywords.join(',') : (report.keywords || null);
        db.prepare('UPDATE projects SET ai_summary=?, ai_health=?, ai_next_steps=?, ai_last_generated_at=CURRENT_TIMESTAMP, keywords=? WHERE id=?')
          .run(summary, JSON.stringify(report.health||null), JSON.stringify(report.next_steps||null), keywords, projectRow.lastInsertRowid);
        db.prepare('INSERT INTO ai_reports (project_id, report) VALUES (?,?)')
          .run(projectRow.lastInsertRowid, JSON.stringify(report));
      } catch (e) {
        console.error('AI analysis failed:', e.message);
      }
    }
    const repoUrl = `https://github.com/${fullName}`;
    console.log("Analysis completed ....")
    res.json({
      projectId: projectRow.lastInsertRowid,
      repo: fullName,
      repoUrl,
      analyzed: !!report,
      report,
      metadata: {
        title: body.title || repoName,
        description: body.description || null,
        category: body.category || null,
        languages: Array.isArray(body.languages) ? body.languages : (body.languages ? [body.languages] : []),
        reasonHalted: body.reasonHalted || null,
        documentation: body.documentation || body.documentationUrl || null,
        demo: body.demo || body.demoUrl || null,
        projectFileKey: body.projectFileKey || parsed.key,
        projectFileUrl: s3Url
      }
    });
  } catch (e) {
    console.error('[uploadS3Zip]', e);
    res.status(500).json({ error: 'Failed to import S3 zip', detail: e.message });
  }
}

async function analyzeProject(req, res) {
  const id = Number(req.params.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.owner_user_id !== req.user.id) {
    // allow any authenticated user for now
  }
  try {
    const report = await requestAnalysis(project.bot_repo_full_name);
    const summary = report.summary || report.project_summary || null;
    const keywords = Array.isArray(report.keywords) ? report.keywords.join(',') : (report.keywords || null);
    db.prepare('UPDATE projects SET ai_summary=?, ai_health=?, ai_next_steps=?, ai_last_generated_at=CURRENT_TIMESTAMP, keywords=? WHERE id=?')
      .run(summary, JSON.stringify(report.health||null), JSON.stringify(report.next_steps||null), keywords, id);
    db.prepare('INSERT INTO ai_reports (project_id, report) VALUES (?,?)')
      .run(id, JSON.stringify(report));
    res.json({ report });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'AI server failed', detail: e.message });
  }
}

function adoptProject(req, res) {
  const id = Number(req.params.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const newName = `${project.bot_repo_full_name.split('/')[1]}_adopt_${req.user.id}`.slice(0,90);
  forkRepo(project.bot_repo_full_name, newName)
    .then(fullName => {
      const info = db.prepare('INSERT INTO adoptions (project_id, adopter_user_id, fork_full_name) VALUES (?,?,?)')
        .run(id, req.user.id, fullName);
      res.json({ adoptionId: info.lastInsertRowid, fork: fullName });
    })
    .catch(e => {
      console.error(e);
      res.status(500).json({ error: 'Fork failed', detail: e.message });
    });
}

module.exports = { listProjects, uploadZip, uploadGitHubUrl, analyzeProject, adoptProject, uploadS3Zip };
