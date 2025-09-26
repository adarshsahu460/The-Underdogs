const AWS = require("aws-sdk");
require("dotenv").config({ path: "../.env" });

console.log("=== AWS Configuration Debug ===");
console.log(
  "AWS_ACCESS_KEY_ID:",
  process.env.AWS_ACCESS_KEY_ID ? "Set" : "Not set"
);
console.log(
  "AWS_SECRET_ACCESS_KEY:",
  process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Not set"
);
console.log("AWS_REGION:", process.env.AWS_REGION);
console.log("AWS_S3_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME);

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3();

// Test S3 connection
async function testS3Connection() {
  try {
    console.log("\n=== Testing S3 Connection ===");

    // List buckets to test credentials
    const buckets = await s3.listBuckets().promise();
    console.log("✅ S3 connection successful!");
    console.log(
      "Available buckets:",
      buckets.Buckets.map((b) => b.Name)
    );

    // Check if our bucket exists
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const bucketExists = buckets.Buckets.some((b) => b.Name === bucketName);
    console.log(`Bucket "${bucketName}" exists:`, bucketExists);

    if (bucketExists) {
      // List objects in the bucket
      const objects = await s3
        .listObjectsV2({
          Bucket: bucketName,
          Prefix: "projects/",
        })
        .promise();

      console.log(`\nObjects in "${bucketName}/projects/":`);
      if (objects.Contents && objects.Contents.length > 0) {
        objects.Contents.forEach((obj) => {
          console.log(`- ${obj.Key} (${obj.Size} bytes, ${obj.LastModified})`);
        });
      } else {
        console.log("No objects found in projects/ folder");
      }
    }
  } catch (error) {
    console.error("❌ S3 connection failed:", error.message);
    if (error.code === "InvalidAccessKeyId") {
      console.error("Invalid Access Key ID");
    } else if (error.code === "SignatureDoesNotMatch") {
      console.error("Invalid Secret Access Key");
    } else if (error.code === "AccessDenied") {
      console.error("Access denied - check IAM permissions");
    }
  }
}

testS3Connection();
