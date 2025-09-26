const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const simpleGit = require('simple-git');
const prisma = require('../models/db');
const config = require('../config');
const { analyzeContributionDiff } = require('./aiService');

/**
 * Clone a repository (bot repo) into a temp folder.
 */
async function cloneRepo(fullName) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'));
  const remoteUrl = `https://github.com/${fullName}.git`;
  const git = simpleGit({ baseDir: tempDir });
  await git.clone(remoteUrl, tempDir);
  return { dir: tempDir, git };
}

/**
 * Compute diff between two commits/branches and return structured info.
 */
async function generateDiff({ fullName, baseRef, headRef }) {
  const { dir, git } = await cloneRepo(fullName);
  // Fetch all refs to ensure both exist
  await git.fetch();
  const baseCommit = await git.revparse([baseRef]);
  const headCommit = await git.revparse([headRef]);
  const diffText = await git.diff([`${baseCommit}..${headCommit}`]);
  return { diffText, baseCommit, headCommit, repoDir: dir };
}

/**
 * Persist contribution, snapshot + AI analysis.
 */
async function recordContribution({ projectId, contributorUserId, baseCommit, headCommit, diffText, aiSummaryInput }) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');
  const prevSummary = project.aiSummary || '';
  const truncatedDiff = diffText.slice(0, config.contributions.diffMaxChars);
  const analysis = await analyzeContributionDiff({
    diff: truncatedDiff,
    previousSummary: prevSummary,
    projectTitle: project.title || project.name || 'Project'
  });
  const { contributionSummary, updatedProjectSummary, nextSteps } = analysis;
  const normalizeNextSteps = (val) => {
    if (!val) return null;
    if (Array.isArray(val)) return val.join('\n');
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  };
  return await prisma.$transaction(async(tx) => {
    const contrib = await tx.contribution.create({
      data: {
        projectId,
        contributorUserId,
        baseCommit,
        headCommit,
        diffTruncated: truncatedDiff,
        diffSize: diffText.length,
        aiContributionSummary: contributionSummary,
        aiNextSteps: normalizeNextSteps(nextSteps),
        aiUpdatedProjectSummary: updatedProjectSummary
      }
    });
    // Store snapshot of old + new summary
    await tx.projectSummarySnapshot.create({ data: {
      projectId,
      contributionId: contrib.id,
      previousSummary: prevSummary,
      newSummary: updatedProjectSummary
    }});
    // Update project
    await tx.project.update({ where: { id: projectId }, data: { aiSummary: updatedProjectSummary, aiNextSteps: normalizeNextSteps(nextSteps), aiLastGeneratedAt: new Date() } });
    return { contrib, analysis };
  });
}

module.exports = { generateDiff, recordContribution };
