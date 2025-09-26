Project structure (hackathon-friendly)

- api/      -> External API wrappers/clients (e.g., Slack, Stripe, OpenAI)
- config/   -> App configuration, constants, environment parsing
- controllers/ -> Request handlers (thin), call services and return responses
- middlewares/ -> Express middlewares (auth, validation, logging)
- models/   -> Data models or schemas (e.g., Mongo/Prisma/Sequelize) or in-memory
- routes/   -> Express routers mapping paths to controllers
- services/ -> Business logic (fat)
- utils/    -> Shared utilities and helpers
- app.js    -> Express app wiring

Rules of thumb
- controllers should be small and orchestrate services
- services hold business logic, are testable and framework-agnostic
- models define data shape and storage concerns
- routes are just wiring
- utils should be pure and small
