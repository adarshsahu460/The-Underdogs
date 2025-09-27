const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pinataSDK = require("@pinata/sdk");
const stream = require("stream");

// --- CONFIGURATION ---
// Load environment variables (ensure the path is correct for your project structure)
require("dotenv").config({ path: "../.env" });

// Initialize Express App
const app = express();
const PORT = 5001;

// Initialize Pinata SDK
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

// Multer configuration for IPFS (uses memory storage)
const ipfsUpload = multer({ storage: multer.memoryStorage() });

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- STARTUP LOGS ---
console.log("=== Server Configuration ===");
console.log("AWS Config:", {
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_S3_BUCKET_NAME,
});
console.log("Pinata Config:", {
  hasApiKey: !!process.env.PINATA_API_KEY,
});

// --- API ROUTES ---

// Mount existing project routes
app.use("/api/projects", require("./routes/projects"));

// --- S3 FILE UPLOAD ROUTE ---
// Uploads to S3 and returns a temporary, secure pre-signed URL.
app.post(
  "/api/upload-s3",
  require("./middleware/upload").single("projectFile"), // Assumes your S3 multer config is in './middleware/upload'
  (req, res) => {
    console.log("=== S3 File Upload Route Hit ===");

    if (!req.file) {
      console.log("❌ No file was uploaded for S3");
      return res.status(400).json({
        success: false,
        message: "No file was uploaded",
      });
    }

    console.log("✅ File uploaded successfully to S3:", {
      originalName: req.file.originalname,
      key: req.file.key,
      location: req.file.location,
    });

    try {
      // Import your configured S3 client (assumes it's in './config/aws')
      const { s3 } = require("./config/aws");

      const preSignedUrl = s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: req.file.key,
        Expires: 3600, // 1 hour expiry
      });

      console.log("✅ Pre-signed URL generated successfully for S3 object");

      res.json({
        success: true,
        message: "File uploaded successfully to S3!",
        file: {
          originalName: req.file.originalname,
          key: req.file.key,
          preSignedUrl: preSignedUrl,
          size: req.file.size,
          uploadedAt: new Date().toISOString(),
          expiresIn: 3600,
        },
      });
    } catch (error) {
      console.error("❌ Error generating S3 pre-signed URL:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate secure download URL",
      });
    }
  }
);

// --- IPFS FILE UPLOAD ROUTE ---
// Uploads to IPFS via Pinata and returns the permanent CID.
app.post(
  "/api/upload-ipfs",
  ipfsUpload.single("projectFile"),
  async (req, res) => {
    console.log("=== IPFS File Upload Route Hit ===");

    if (!req.file) {
      console.log("❌ No file was uploaded for IPFS");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded for IPFS" });
    }

    try {
      // Create a readable stream from the file buffer
      const fileStream = stream.Readable.from(req.file.buffer);

      const options = {
        pinataMetadata: {
          name: req.file.originalname,
        },
      };

      const result = await pinata.pinFileToIPFS(fileStream, options);

      console.log("✅ File pinned successfully to IPFS:", {
        cid: result.IpfsHash,
      });

      res.json({
        success: true,
        message: "File uploaded to IPFS successfully!",
        cid: result.IpfsHash,
        file: {
          originalName: req.file.originalname,
          size: req.file.size,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Error uploading to IPFS via Pinata:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file to IPFS",
      });
    }
  }
);

// Root route for API health check
app.get("/", (req, res) => {
  res.json({ message: "API is running!" });
});

// --- SERVER LISTENER ---
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
