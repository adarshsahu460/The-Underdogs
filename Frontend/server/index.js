const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "../.env" });

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

console.log("=== Server Configuration ===");
console.log("AWS Config:", {
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_S3_BUCKET_NAME,
});

// Routes
app.use("/api/projects", require("./routes/projects"));

// S3 File Upload route (uploads file and returns pre-signed URL)
app.post(
  "/api/upload-file",
  require("./middleware/upload").single("projectFile"),
  (req, res) => {
    console.log("=== File Upload Route Hit ===");

    if (req.file) {
      console.log("✅ File uploaded successfully to S3:", {
        originalName: req.file.originalname,
        key: req.file.key,
        location: req.file.location,
        size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
      });

      try {
        // Generate pre-signed URL with 3600 seconds (1 hour) expiry
        const { s3 } = require("./config/aws");
        const preSignedUrl = s3.getSignedUrl("getObject", {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: req.file.key,
          Expires: 3600, // 1 hour expiry
        });

        console.log("✅ Pre-signed URL generated successfully");

        res.json({
          success: true,
          message: "File uploaded successfully to S3!",
          file: {
            originalName: req.file.originalname,
            key: req.file.key,
            preSignedUrl: preSignedUrl, // Send pre-signed URL instead of direct location
            size: req.file.size,
            uploadedAt: new Date().toISOString(),
            expiresIn: 3600, // Expiry time in seconds
          },
        });
      } catch (error) {
        console.error("❌ Error generating pre-signed URL:", error);
        res.status(500).json({
          success: false,
          message: "Failed to generate secure download URL",
        });
      }
    } else {
      console.log("❌ No file was uploaded");
      res.status(400).json({
        success: false,
        message: "No file was uploaded",
      });
    }
  }
);

app.get("/", (req, res) => {
  res.json({ message: "EngiVerse API is running!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
