config/ folder

Purpose: Centralized config and constants.

Typical files:
- env.js — parse process.env, validate, export config object
- constants.js — enums, magic strings

Example env.js shape:
module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
