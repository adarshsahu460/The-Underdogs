const { Octokit } = require('@octokit/rest');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const octokit = new Octokit({ auth: config.github.token });

// Determine the actual project root inside an extracted zip directory.
// If the top-level contains exactly one non-metadata directory (excluding __MACOSX/_MACOSX)
// and no other real files (besides ignorable artifacts like .DS_Store), we descend into it.
function resolveRealRoot(localDir) {
  try {
    const entries = fs.readdirSync(localDir, { withFileTypes: true });
    const IGNORE_DIRS = new Set(['__MACOSX', '_MACOSX']);
    const IGNORE_FILES = new Set(['.DS_Store']);
    const dirNames = [];
    let otherFiles = 0;
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name)) dirNames.push(e.name);
      } else if (e.isFile()) {
        if (!IGNORE_FILES.has(e.name)) otherFiles++;
      }
    }
    if (dirNames.length === 1 && otherFiles === 0) {
      const candidate = dirNames[0];
      const candidatePath = path.join(localDir, candidate);
      // Basic heuristic: ensure candidate has at least one non-ignored file inside.
      const inner = fs.readdirSync(candidatePath, { withFileTypes: true });
      const hasRealContent = inner.some(i => {
        if (i.isDirectory()) return true;
        if (i.isFile() && !IGNORE_FILES.has(i.name)) return true;
        return false;
      });
      if (hasRealContent) return candidatePath;
    }
  } catch (e) {
    // Fallback silently
  }
  return localDir;
}

async function ensureRepo(repoName) {
  // Try to get repo, else create
  try {
    await octokit.repos.get({ owner: config.github.org, repo: repoName });
  } catch (e) {
    if (e.status === 404) {
      await octokit.repos.createInOrg({
        org: config.github.org,
        name: repoName,
        private: false,
        auto_init: false
      });
    } else throw e;
  }
}

async function pushProjectDirectory(localDir, repoName) {
  await ensureRepo(repoName);
  const remoteUrl = `https://x-access-token:${config.github.token}@github.com/${config.github.org}/${repoName}.git`;
  const rootDir = resolveRealRoot(localDir);
  const git = simpleGit({ baseDir: rootDir });
  // Initialize repo if not already
  if (!fs.existsSync(path.join(rootDir, '.git'))) {
    await git.init();
  }
  await git.add('.');
  // Commit with random id to avoid duplicate empty commit errors
  const hash = crypto.randomBytes(4).toString('hex');
  await git.commit(`Initial upload ${hash}`);
  await git.branch(['-M', config.github.defaultBranch]);
  await git.addRemote('origin', remoteUrl).catch(() => {});
  await git.push('origin', config.github.defaultBranch, { '--force': null });
  return `${config.github.org}/${repoName}`;
}

async function forkRepo(fullName, newName) {
  const [owner, repo] = fullName.split('/');
  const fork = await octokit.repos.createFork({ owner, repo, organization: config.github.org });
  // Optionally rename
  if (newName && fork?.data?.name !== newName) {
    await octokit.repos.update({ owner: config.github.org, repo: fork.data.name, name: newName });
  }
  return `${config.github.org}/${newName || fork.data.name}`;
}

module.exports = { pushProjectDirectory, forkRepo };
