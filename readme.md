Dev-Yard – Marketplace for Unfinished Engineering Projects
================================================================

Turn abandoned student side‑projects into collaborative, evolving open assets. Dev-Yard lets students upload dormant codebases (ZIP/S3/GitHub), automatically analyzes them with AI to produce a Health Report + Continuation Roadmap, and enables other contributors to adopt, extend, and document progress through verifiable contribution sessions.

Core Vision / USP
-----------------
AI Project Reviver that:
* Clones / ingests the repo and produces a structured JSON “Project Health Report”.
* Summarizes status, tech stack, gaps, and assigns a contribution friendliness score.
* Generates a Next Steps Roadmap (actionable, bite‑sized tasks) + evolving project summary after each contribution.
* Creates contribution-aware diffs: every uploaded improvement triggers AI diff analysis -> updated project summary and suggested next steps.

Current Architecture Overview
-----------------------------
* Frontend: Vite + React + Tailwind (`Frontend/`) – pages for browsing, uploading, and viewing (browse + upload implemented; detail & adoption pending).
* Backend API: Node.js + Express + Prisma + PostgreSQL (`Backend/`). Handles auth, project ingestion (ZIP, S3 URL, GitHub clone), AI report persistence, contribution sessions & diff AI updates, GitHub bot repo management, S3 storage abstraction.
* ML / AI Service: FastAPI + LangChain + Ollama (CodeLlama 7B) (`ML Server/`). Endpoints:
    * `POST /analyze-repository` – clone repo, build & test heuristics, produce structured JSON summary & health report.
    * `POST /analyze-diff` – given diff + previous summary, produce contribution summary, updated project summary, next steps.
* GitHub Bot Integration: Pushes uploaded source into an org repo; supports forking for adoption.
* Contribution Sessions: Download source snapshot (embedded manifest) → contributor edits → re‑upload → backend creates commit, diff, AI analysis, timeline snapshot.

Implemented Backend Features
----------------------------
* Auth: Register / Login (JWT) – basic.
* Project ingestion:
    * Upload ZIP (multipart) (logged in user).
    * Import GitHub URL (clone + re‑push into bot namespace).
    * Import S3 ZIP via presigned or credentialed fetch (`/api/projects/upload/s3`).
* AI Analysis:
    * Auto-run on S3 import (configurable) storing aiSummary, aiHealth, aiNextSteps, keywords.
    * Manual re‑analysis endpoint (`analyzeProject` not yet routed publicly – could expose soon).
* Data model: Users, Projects, Adoptions, AI Reports, Contributions, Contribution Sessions, Project Summary Snapshots.
* Contribution Flow (Phase 2): Download session ZIP (with manifest) → upload updated ZIP → commit diff + AI diff analysis + evolving summary & next steps.
* GitHub operations: create repo, push initial code, fork for adoption.
* Timeline: contributions & sessions accessible via `/api/projects/:id/...` endpoints.
* Resilient import of S3 object supporting both presigned URLs and direct SDK fetch.

Not Yet / Partial / Gaps
------------------------
* No dedicated Project Detail API route for combined health + adoption actions on frontend (getProject exists but frontend page not wired).
* No skill tagging model (skills for users & mapping to project keywords).
* No recommendation engine (match contributors to projects via embeddings / tags / recency / difficulty).
* No mentor role differentiation or feedback / review entities.
* No funding / pledge model.
* Missing endpoints: adoptProject route not mounted in current router export (adoption logic exists in controller but not wired in `projectRoutes.js`).
* AI pitch deck generation (multi-slide JSON spec) not yet implemented.
* Authentication missing on some sensitive debug endpoints (`/api/list`).
* Rate limiting / abuse protection absent.
* File size, language detection & license detection heuristics basic / absent.
* No background job queue (all AI calls synchronous in request cycle → risk of timeouts under load).
* Frontend lacks: Project detail view with timeline, adopt button, health report rendering, AI roadmap visualization, user auth integration / token storage.
* No tests (unit/integration) in Backend or ML service.
* Env / deployment docs minimal; no Docker Compose.
* Contribution friendliness score calculated only implicitly via AI; not persisted separately.
* Multi-user concurrency & merge conflict strategy simplified (destructive overwrite approach).

Quick Start
-----------

Backend:
1. Copy `.env.example` to `.env` and fill: `GITHUB_BOT_TOKEN`, `GITHUB_BOT_ORG`, `DATABASE_URL`, `AI_SERVER_BASE_URL` (FastAPI URL), optional S3 vars.
2. Install & run:
     - `npm install`
     - `npx prisma migrate deploy` (or `prisma migrate dev` during dev)
     - `npm run dev`
3. (Optional) Open Prisma Studio: `npx prisma studio`.

Frontend:
1. `npm install`
2. `npm run dev`
3. Ensure API base URLs point to backend (currently hardcoded ngrok URLs – replace with env variable / proxy).

ML Server:
1. `python3 -m venv venv && source venv/bin/activate`
2. `pip install -r requirements.txt`
3. Run: `uvicorn main:app --reload`
4. Ensure Ollama model `codellama:7b` is available (pull with `ollama pull codellama:7b`).

High-Level API Endpoints (selected)
----------------------------------
* `GET /api/projects` – list minimal project info.
* `POST /api/projects/upload/s3` – import project (S3/presigned/or general URL *.zip*).
* `GET /api/projects/:projectId` – full project with related entities.
* `GET /api/projects/:projectId/contributions/download` – start contribution session.
* `POST /api/projects/:projectId/contributions/upload` – upload contribution ZIP.
* `GET /api/projects/:projectId/contributions/timeline` – contribution timeline.
* `GET /api/projects/:projectId/contributions/analyze-diff` – legacy diff comparison.

Unique Selling Propositions (USPs)
----------------------------------
1. AI-Driven Continuous Summary: Project summary evolves with every contribution diff automatically.
2. Contribution Session Manifests: Deterministic idempotency & provenance (prevents duplicate processing and enables replay safety).
3. Zero-Friction Adoption: Fork + timeline tracking baked in (adoption flow ready in controller) – easily shows lineage of project evolution.
4. AI Health & Roadmap Pairing: Combines technical health metrics (build/test presence) with curated actionable roadmap chunks.
5. Unified Multi-Source Ingestion: Accepts ZIP (browser), S3 references (presigned), or cloning live GitHub repositories.
6. AI Diff Summarization: Converts raw diffs into human readable contribution summaries & next step guidance (on every session).

Planned / Recommended Next Features
-----------------------------------
Short Term (≤ 1 day):
* Wire adoption endpoint into routes & frontend (fork + display fork URL).
* Implement Project Detail Page (health report, summary, roadmap, timeline cards).
* Add .env templating & configurable API base in frontend (Vite env + central fetch wrapper).
* Protect `/api/list` with auth & role check.
* Add manual “Re-run AI Analysis” button (POST endpoint -> queue or immediate).
* Store structured pieces of AI summary (pitch, problem_solved, tech_stack) into dedicated DB columns or JSON for filtering.

Mid Term (1–3 days):
* Skill Tagging: Vectorize user stated skills + project keywords (embeddings – OpenAI / local) → recommendation endpoint.
* Mentor Feedback: New table (MentorFeedback) with inline AI summarization of all feedback.
* Pitch Deck Generator: AI endpoint returning multi-slide JSON (title, problem, solution, traction metrics, next steps) -> frontend PDF export.
* Rate Limiting (express-rate-limit) + request tracing.
* Background Worker (BullMQ / simple queue) for long AI tasks; respond with 202 + polling endpoint.
* Embedding-based search across AI summaries & diffs.
* Basic test suite (Jest or node:test) for controllers & ML FastAPI tests (pytest + httpx).

Longer Term:
* Funding / Micro‑bounties: Allow mentors to attach micro tasks & pledge amounts.
* Reputation / Badges based on accepted contributions & AI-rated impact.
* On-platform lightweight inline code review threads.
* Multi-branch contribution flows (avoid forced main overwrites, PR simulation inside bot org).

Fast Innovation Ideas (1–2 hour Implementable)
---------------------------------------------
1. Adoption Route Wiring: Add `router.post('/:id/adopt', adoptProject)` + frontend “Adopt Project” button showing fork URL.
2. Project Detail Page MVP: Fetch `/api/projects/:id` & render aiSummary, aiNextSteps, stats, list of contributions with relative timestamps.
3. “Regenerate Roadmap” Button: Calls analyzeProject (expose route) & updates UI, with loading spinner.
4. Frontend Env Refactor: Introduce `VITE_API_BASE` & replace hardcoded ngrok URLs.
5. Health Badge Component: Display build/test status (icons) from latest health_report.
6. Keywords → Tags: Parse `keywords` field comma list into clickable filters on Browse page.
7. Add `/api/projects/:id/pitch` endpoint returning minimal pitch & next steps for sharing.
8. Simple Rate Limit: Add express-rate-limit to AI analysis endpoints.
9. Auth Integration Frontend: Add login modal storing JWT in memory/localStorage & attach Authorization header.
10. Prisma seed script: Create demo users + sample projects for faster demos.

Stretch Quick Wins (≈2 hrs):
* AI Pitch JSON to Markdown exporter frontend (turn AI summary into shareable gist text).
* Lightweight Recommendation Endpoint: Query projects ordered by recency & matching overlapping languages vs user-declared skills (simple intersection score before full embeddings).
* Contribution Diff Viewer: Fetch diff text & syntax highlight (react-diff-viewer) in Project Detail.

Data Model Enhancements (Proposed)
----------------------------------
Add tables:
* MentorFeedback(id, projectId, mentorUserId, message, aiSummary, createdAt)
* ProjectSkill(tag, projectId) (or JSON array) for normalized filtering.
* UserSkill(tag, userId, proficiency?)
* FundingPledge(id, projectId, mentorUserId, amount, currency, status)

Security / Hardening Checklist
------------------------------
* Protect debug list endpoint.
* Validate & sanitize user inputs (titles/descriptions) – consider DOMPurify on frontend for any rich text later.
* Add file size / content-type enforcement (Multer already limits memory; extend validation).
* Timeout / retry strategy for AI calls; queue if > N seconds.
* GitHub token scoping (least privilege) & rotate.
* Audit logs for adoption & contribution events.

Testing Suggestions
-------------------
* Unit: aiService error handling, githubService repo creation fallback, contribution manifest parser edge cases.
* Integration: Upload S3 ZIP → AI analysis fields persisted; contribution session full cycle.
* ML Server: Snapshot test structure of JSON from analyze-repository with a known small repo fixture.

Local Development Tips
----------------------
* Use ngrok for exposing backend to frontend quickly (already in usage) – prefer .env value to avoid hardcoding.
* For faster AI iteration, support a MOCK_AI=1 flag returning canned JSON.
* Use `prisma generate` after schema edits.

Contributing Flow (MVP)
-----------------------
1. Upload or import project.
2. AI Health + Summary auto-populated.
3. Adopt (fork) or Download Contribution Session ZIP.
4. Make changes → repackage → upload contribution.
5. AI diff updates summary & next steps; timeline grows.

Immediate TODO Checklist (Actionable Next Steps)
-----------------------------------------------
* [ ] Add adoption route wiring & frontend button.
* [ ] Expose analyzeProject route (`POST /api/projects/:id/reanalyze`).
* [ ] Frontend Project Detail page.
* [ ] Replace hardcoded ngrok URLs with `import.meta.env.VITE_API_BASE`.
* [ ] Add keywords tag filter to Browse page.
* [ ] Add auth UI + attach JWT for protected endpoints.
* [ ] Guard `/api/list` with auth middleware.
* [ ] Add simple rate limiter.
* [ ] Seed script + demo data.
* [ ] Mock AI mode for dev.

Original Quick Commands
-----------------------
Backend:
        npm run dev
        ngrok http 3000
        npx prisma studio

Frontend:
        npm run dev
        node server/index.js

ML Server:
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        uvicorn main:app --reload

License
-------
MIT (adjust if funding / proprietary modules added later)
