const { Router } = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const auth = require('../middlewares/auth');
const { listProjects, listProjectsRaw, uploadS3Zip, getProject, adoptProject, analyzeProject, getProjectHealth, searchProjects, getHealthTimeline, streamReanalyze } = require('../controllers/projectController');
const { analyzeContribution, getTimeline: legacyTimeline } = require('../controllers/contributionController');
const contributionSessionController = require('../controllers/contributionSessionController');

const router = Router();

router.get('/', auth(false), listProjects);
router.get('/search', auth(false), searchProjects);
router.get('/list', auth(false), listProjectsRaw);
router.get('/:projectId', auth(false), getProject); // must appear before deeper nested :projectId routes
router.get('/:projectId/health', auth(false), getProjectHealth);
router.get('/:projectId/health/timeline', auth(false), getHealthTimeline);
router.get('/:projectId/stream/reanalyze', auth(false), streamReanalyze);
router.post('/:projectId/reanalyze', auth(false), analyzeProject);
router.post('/:projectId/adopt', auth(true), adoptProject);

// Phase 2 contribution sessions
router.get('/:projectId/contributions/download', auth(false), contributionSessionController.initiateDownload);
// Accept ANY single file field (projectFile, file, archive, zip, upload, etc.) to avoid Multer "Unexpected field".
// Multer's .any() returns an array of files; we pick the first matching candidate.
const contributionUpload = [
	auth(false),
	upload.any(),
	function pickFile(req, _res, next) {
		if (req.file) return next();
		if (Array.isArray(req.files) && req.files.length) {
			const preferredNames = new Set(['projectFile','file','archive','zip','upload']);
			let chosen = req.files.find(f => preferredNames.has(f.fieldname));
			if (!chosen) chosen = req.files[0];
			req.file = chosen;
		}
		return next();
	},
	contributionSessionController.uploadContribution
];
router.post('/:projectId/contributions/upload', contributionUpload);
router.get('/:projectId/contributions/timeline', auth(false), contributionSessionController.getTimeline);

// Legacy diff analysis (optional keep)
router.get('/:projectId/contributions/analyze-diff', auth(false), analyzeContribution);
router.get('/:projectId/contributions/timeline-legacy', auth(false), legacyTimeline);

// S3 import
// Protected: requires authentication so ownerUserId is always set
router.post('/upload/s3', auth(true), upload.none(), uploadS3Zip);

module.exports = router;
