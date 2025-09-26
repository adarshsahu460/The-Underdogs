const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { pipeline } = require('stream');
const { promisify } = require('util');
const config = require('../config');

const pipe = promisify(pipeline);

let s3Client = null;
if (config.s3.bucket && config.s3.accessKeyId && config.s3.secretAccessKey) {
  s3Client = new S3Client({
    region: config.s3.region,
    endpoint: config.s3.endpoint || undefined,
    forcePathStyle: config.s3.forcePathStyle,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey
    }
  });
}

function isS3Enabled() { return !!s3Client; }

async function uploadBuffer(key, buffer, contentType='application/octet-stream') {
  if (!isS3Enabled()) {
    const local = path.join(config.uploads.tempDir, key);
    await fs.promises.mkdir(path.dirname(local), { recursive: true });
    await fs.promises.writeFile(local, buffer);
    return { storage: 'local', key, path: local };
  }
  await s3Client.send(new PutObjectCommand({ Bucket: config.s3.bucket, Key: key, Body: buffer, ContentType: contentType }));
  return { storage: 's3', key };
}

async function downloadToFile(key, destPath) {
  if (!isS3Enabled()) {
    // local
    const local = path.join(config.uploads.tempDir, key);
    await fs.promises.copyFile(local, destPath);
    return destPath;
  }
  const res = await s3Client.send(new GetObjectCommand({ Bucket: config.s3.bucket, Key: key }));
  await pipe(res.Body, fs.createWriteStream(destPath));
  return destPath;
}

module.exports = { uploadBuffer, downloadToFile, isS3Enabled };
