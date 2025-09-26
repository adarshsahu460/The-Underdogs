const { Router } = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const auth = require('../middlewares/auth');
const { listProjects, uploadS3Zip } = require('../controllers/projectController');

const router = Router();

router.get('/', auth(false), listProjects);
// Frontend sends JSON { s3Url, title?, analyze? }
// router.post('/upload/s3', auth(), upload.none(), uploadS3Zip);
// Require auth for S3 uploads so we have a user id for repo naming
router.post('/upload/s3', upload.none(), uploadS3Zip);

module.exports = router;
