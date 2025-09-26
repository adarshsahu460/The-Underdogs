Hackathon Starter Blueprint

Quick start
- npm run setup  # creates .env if missing
- npm run dev    # start with nodemon

Structure
- index.js           — entrypoint bootstrapping env + server
- src/app.js         — Express app with health and API mount
- src/api/           — clients for external services
- src/config/        — environment and constants
- src/controllers/   — HTTP handlers calling services
- src/middlewares/   — cross-cutting middleware
- src/models/        — data schemas/persistence
- src/routes/        — API routes
- src/services/      — business logic
- src/utils/         — helpers

Conventions
- Controllers thin, Services fat
- Use env vars only via config module
- Add tests under a tests/ folder if needed
