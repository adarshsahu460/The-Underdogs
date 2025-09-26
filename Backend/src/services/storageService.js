const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');
const { pipeline } = require('stream');
const { promisify } = require('util');
const config = require('../config');

const pipe = promisify(pipeline);

let s3Client = null;
let detectingRegionPromise = null;

function haveS3Config() {
  return !!(config.s3.bucket && config.s3.accessKeyId && config.s3.secretAccessKey);
}

function buildClient(regionOverride) {
  return new S3Client({
    region: regionOverride || config.s3.region || 'us-east-1',
    endpoint: config.s3.endpoint || undefined,
    forcePathStyle: config.s3.forcePathStyle,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey
    }
  });
}

async function detectBucketRegion(force = false) {
  if (!haveS3Config()) return null;
  if (config.s3.region && !force) return config.s3.region;
  if (detectingRegionPromise) return detectingRegionPromise;
  // Use provisional client (us-east-1 works for GetBucketLocation even if bucket in another region)
  detectingRegionPromise = (async () => {
    const provisional = buildClient('us-east-1');
    try {
      const out = await provisional.send(new GetBucketLocationCommand({ Bucket: config.s3.bucket }));
      let region = out.LocationConstraint || 'us-east-1';
      // AWS returns 'EU' for eu-west-1 legacy
      if (region === 'EU') region = 'eu-west-1';
      config.s3.region = region; // mutate live config so future clients use it
      s3Client = buildClient(region);
      console.log(`[s3] Detected bucket region: ${region}`);
      return region;
    } catch (e) {
      console.warn('[s3] Bucket region detection failed:', e.message);
      // Keep existing (maybe user supplied) region
      if (!s3Client) s3Client = buildClient(config.s3.region || 'us-east-1');
      return config.s3.region || 'us-east-1';
    } finally {
      detectingRegionPromise = null;
    }
  })();
  return detectingRegionPromise;
}

function ensureClientSync() {
  if (!s3Client && haveS3Config()) {
    s3Client = buildClient(config.s3.region || 'us-east-1');
  }
  return s3Client;
}

async function ensureClient() {
  ensureClientSync();
  if (!config.s3.region && haveS3Config()) {
    // Fire & forget detection; first operations may retry
    detectBucketRegion().catch(()=>{});
  }
  return s3Client;
}

function isS3Enabled() { return !!haveS3Config(); }

async function withS3Retry(opFn) {
  if (!isS3Enabled()) return opFn();
  const client = await ensureClient();
  try {
    return await opFn(client);
  } catch (e) {
    const code = e.Code || e.code;
    if (code === 'PermanentRedirect' || code === 'AuthorizationHeaderMalformed') {
      // Attempt region detection then retry once
      await detectBucketRegion(true);
      const retryClient = ensureClientSync();
      try {
        return await opFn(retryClient);
      } catch (e2) {
        throw e2;
      }
    }
    throw e;
  }
}

async function uploadBuffer(key, buffer, contentType='application/octet-stream') {
  if (!isS3Enabled()) {
    const local = path.join(config.uploads.tempDir, key);
    await fs.promises.mkdir(path.dirname(local), { recursive: true });
    await fs.promises.writeFile(local, buffer);
    return { storage: 'local', key, path: local };
  }
  await withS3Retry(async (client) => {
    await client.send(new PutObjectCommand({ Bucket: config.s3.bucket, Key: key, Body: buffer, ContentType: contentType }));
  });
  return { storage: 's3', key };
}

async function downloadToFile(key, destPath) {
  if (!isS3Enabled()) {
    const local = path.join(config.uploads.tempDir, key);
    await fs.promises.copyFile(local, destPath);
    return destPath;
  }
  const res = await withS3Retry(async (client) => {
    return client.send(new GetObjectCommand({ Bucket: config.s3.bucket, Key: key }));
  });
  await pipe(res.Body, fs.createWriteStream(destPath));
  return destPath;
}

module.exports = { uploadBuffer, downloadToFile, isS3Enabled };
