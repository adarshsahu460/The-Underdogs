const { Router } = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const auth = require('../middlewares/auth');
const { listProjects, listProjectsRaw, uploadS3Zip } = require('../controllers/projectController');
const { analyzeContribution, getTimeline: legacyTimeline } = require('../controllers/contributionController');
const contributionSessionController = require('../controllers/contributionSessionController');

const router = Router();

router.get('/', auth(false), listProjects);
router.get('/list', auth(false), listProjectsRaw);

// Phase 2 contribution sessions
router.get('/:projectId/contributions/download', auth(false), contributionSessionController.initiateDownload);
router.post('/:projectId/contributions/upload', auth(false), upload.single('file'), contributionSessionController.uploadContribution);
router.get('/:projectId/contributions/timeline', auth(false), contributionSessionController.getTimeline);

// Legacy diff analysis (optional keep)
router.get('/:projectId/contributions/analyze-diff', auth(false), analyzeContribution);
router.get('/:projectId/contributions/timeline-legacy', auth(false), legacyTimeline);

// S3 import
router.post('/upload/s3', upload.none(), uploadS3Zip);

module.exports = router;
