controllers/ folder

Purpose: Express handlers that translate HTTP to service calls.

Typical files:
- health.controller.js — responds with service status
- user.controller.js — CRUD endpoints glue code

Contract:
- No DB or external API code here
- Validate inputs, call service, map outputs to HTTP
