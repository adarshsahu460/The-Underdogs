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

Database (Prisma + PostgreSQL)
- Provide DATABASE_URL in your .env (Supabase/Postgres connection string).
- After installing dependencies run:
	- npx prisma migrate deploy (or `migrate dev` locally)
	- npx prisma generate (if not run automatically)

Authentication (Clerk)
- Incoming requests may include a Clerk session token (Authorization: Bearer <token>).
- Middleware resolves Clerk user -> local User row via clerkUserId or email, creating if missing.
- Legacy JWT fallback retained temporarily (remove when migration complete).
- Added optional field clerkUserId (unique). Removed ANONYMOUS role and legacy anonymous bootstrap.

Prisma files
- prisma/schema.prisma — data model
- Generated client in node_modules/@prisma/client after generate.
