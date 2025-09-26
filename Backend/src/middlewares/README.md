middlewares/ folder

Purpose: Cross-cutting concerns for requests.

Typical files:
- error.middleware.js — centralized error handler
- auth.middleware.js — JWT/session checking
- validate.middleware.js — zod/joi schema validation

Guidelines:
- Must call next(err) on errors
- Keep side effects minimal
