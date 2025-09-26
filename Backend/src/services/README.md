services/ folder

Purpose: Business logic, reusable and testable functions.

Typical files:
- user.service.js — CRUD operations
- health.service.js — internal checks

Guidelines:
- No Express req/res here
- Keep functions pure; inject dependencies when possible
