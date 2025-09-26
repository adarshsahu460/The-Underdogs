const { Octokit } = require('@octokit/rest');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const octokit = new Octokit({ auth: config.github.token });

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
  const git = simpleGit({ baseDir: localDir });
  // Initialize repo if not already
  if (!fs.existsSync(path.join(localDir, '.git'))) {
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
