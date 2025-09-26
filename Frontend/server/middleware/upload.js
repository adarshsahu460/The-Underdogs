const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3 } = require("../config/aws");
const path = require("path");

console.log("=== Upload Middleware Initialization ===");
console.log("S3 Config:", {
  bucket: process.env.AWS_S3_BUCKET_NAME,
  region: process.env.AWS_REGION,
});

// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: "private", // Files are private by default
    key: function (req, file, cb) {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = `projects/${uniqueSuffix}${path.extname(
        file.originalname
      )}`;
      console.log("Generated S3 key:", filename);
      cb(null, filename);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  fileFilter: function (req, file, cb) {
    console.log("File filter check:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Only allow zip files
    if (
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed" ||
      path.extname(file.originalname).toLowerCase() === ".zip"
    ) {
      console.log("File accepted");
      cb(null, true);
    } else {
      console.log("File rejected - not a ZIP file");
      cb(new Error("Only ZIP files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

module.exports = upload;