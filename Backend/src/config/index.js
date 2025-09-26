const path = require('path');

const required = (key, fallback) => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var ${key}`);
  return v;
};

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwt: {
    secret: required('JWT_SECRET', 'dev-secret'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  github: {
    token: required('GITHUB_BOT_TOKEN'),
    org: required('GITHUB_BOT_ORG'),
    defaultBranch: process.env.GITHUB_DEFAULT_BRANCH || 'main'
  },
  s3: {
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || 'false').toLowerCase() === 'true'
  },
  ai: {
    baseUrl: process.env.AI_SERVER_BASE_URL,
    apiKey: process.env.AI_SERVER_API_KEY
  },
  uploads: {
    maxMb: Number(process.env.MAX_UPLOAD_MB || 200),
    tempDir: path.join(process.cwd(), 'tmp')
  },
  db: {
    file: path.join(process.cwd(), 'data.sqlite3')
  }
};
