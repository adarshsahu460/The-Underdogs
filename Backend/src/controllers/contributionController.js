const prisma = require('../models/db');

// GET /projects/:projectId/contributions/analyze-diff
// Return diff between the latest and previous commit on main (no DB write)
async function analyzeContribution(req, res) {
  const projectId = req.params.projectId;
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const fullName = project.botRepoFullName || project.repoFullName || project.repoUrl?.replace('https://github.com/','');
    if (!fullName) return res.status(400).json({ error: 'Project has no repository reference' });
    const simpleGit = require('simple-git');
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'udg_main_'));
    const git = simpleGit({ baseDir: tmp });
    await git.clone(`https://github.com/${fullName}.git`, tmp, ['--depth','2','--branch','main']);
    // Get last two commits (if only one commit exists, return note)
    const log = await git.log({ maxCount: 2 });
    if (!log.all.length) return res.json({ note: 'Repository empty' });
    if (log.all.length === 1) {
      return res.json({ latestCommit: log.latest.hash, note: 'Only one commit in main; no diff available.' });
    }
    const headCommit = log.all[0].hash; // latest
    const baseCommit = log.all[1].hash; // previous
    const diffText = await git.diff([`${baseCommit}..${headCommit}`]);
    res.json({ baseCommit, headCommit, diff: diffText || '# Empty diff' });
  } catch (e) {
    console.error('[analyzeContribution]', e);
    res.status(500).json({ error: 'Failed to get main diff', detail: e.message });
  }
}

// GET /projects/:projectId/contributions/timeline
async function getTimeline(req, res) {
  const projectId = req.params.projectId;
  try {
    const contributions = await prisma.contribution.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        createdAt: true,
        contributorUserId: true,
        baseCommit: true,
        headCommit: true,
        aiContributionSummary: true,
        aiNextSteps: true
      }
    });
    res.json({ timeline: contributions });
  } catch (e) {
    console.error('[getTimeline]', e);
    res.status(500).json({ error: 'Failed to load timeline', detail: e.message });
  }
}

module.exports = { analyzeContribution, getTimeline };
