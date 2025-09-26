const AWS = require("aws-sdk");
require("dotenv").config({ path: "../.env" });

console.log("=== Testing Specific Bucket Access ===");

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET_NAME;

async function testBucketAccess() {
  try {
    console.log(`Testing access to bucket: ${bucketName}`);

    // Try to list objects in the bucket
    const result = await s3
      .listObjectsV2({
        Bucket: bucketName,
        MaxKeys: 5,
      })
      .promise();

    console.log("✅ Bucket access successful!");
    console.log(`Found ${result.KeyCount} objects in bucket`);

    if (result.Contents && result.Contents.length > 0) {
      console.log("Recent objects:");
      result.Contents.forEach((obj) => {
        console.log(`- ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log("No objects found in bucket");
    }

    // Test upload permissions with a small test file
    console.log("\n=== Testing Upload Permissions ===");
    const testKey = `test-${Date.now()}.txt`;

    await s3
      .putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: "Test upload from debug script",
        ContentType: "text/plain",
      })
      .promise();

    console.log("✅ Upload test successful!");

    // Clean up test file
    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: testKey,
      })
      .promise();

    console.log("✅ Cleanup successful!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Error Code:", error.code);

    if (error.code === "NoSuchBucket") {
      console.error(`❌ Bucket "${bucketName}" does not exist!`);
    } else if (error.code === "AccessDenied") {
      console.error("❌ Access denied - check bucket permissions");
    }
  }
}

testBucketAccess();
