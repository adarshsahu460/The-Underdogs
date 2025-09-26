routes/ folder

Purpose: Router composition and URL structure.

Typical files:
- index.js — base router mounted at /api
- user.routes.js — declares /api/users endpoints

Rules:
- Keep pure routing here; no business logic
- Import controllers only
