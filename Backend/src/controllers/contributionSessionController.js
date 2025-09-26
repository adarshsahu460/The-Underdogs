const contributionSessions = require('../services/contributionSessionService');
const prisma = require('../models/db');

function handleError(res, e) {
  console.error('[contribution]', e);
  const status = e.status || 500;
  return res.status(status).json({ error: e.code || 'INTERNAL_ERROR', message: e.message });
}

async function initiateDownload(req, res) {
  try {
    const { buffer, filename, meta } = await contributionSessions.createDownloadSession({ projectId: req.params.projectId, userId: req.user?.id });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Idempotency-Key', meta.idempotencyKey);
    return res.send(buffer);
  } catch (e) {
    return handleError(res, e);
  }
}

async function uploadContribution(req, res) {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'FILE_REQUIRED' });
    const result = await contributionSessions.processUpload({ projectId: req.params.projectId, buffer: req.file.buffer, userId: req.user?.id });
    res.setHeader('Idempotency-Status', result.idempotencyStatus);
    return res.json({ contribution: result.contribution });
  } catch (e) {
    return handleError(res, e);
  }
}

async function getTimeline(req, res) {
  try {
    const data = await contributionSessions.getTimeline(req.params.projectId);
    return res.json({ timeline: data });
  } catch (e) {
    return handleError(res, e);
  }
}

module.exports = { initiateDownload, uploadContribution, getTimeline };
