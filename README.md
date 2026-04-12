# AI Command Console

AI Command Console is a production-minded Next.js SaaS foundation for an AI-powered workspace and monitoring platform. It combines a polished frontend with a real backend, PostgreSQL + Prisma data layer, signed session auth, structured API boundaries, seeded demo data, and practical testing/deployment workflows.

## Stack Overview

- Next.js App Router with React 19 and Tailwind CSS
- Integrated Next.js route handlers for the API surface
- PostgreSQL + Prisma ORM for relational data and migrations
- Signed credentials auth with database-backed sessions
- Structured service layer for workspaces, updates, insights, briefs, and reports
- Optional OpenAI-backed summary service with deterministic fallback
- Background job orchestration for async insight and summary generation
- Playwright for browser smoke coverage
- Vitest + Testing Library for unit/component coverage
- Legacy node:test console workflow coverage preserved
- Vercel-ready app hosting model with managed Postgres

## Product Shape

The foundation models a believable intelligence platform where users can:

- sign in and access their workspace
- monitor tracked sources and incoming updates
- review generated insights and recommendations
- create and manage research briefs and reports
- inspect recent activity and operational state

## Folder Structure

- `app/`
  Next.js routes, pages, and API handlers
- `src/components/`
  UI and page-level frontend components
- `src/config/`
  environment validation and runtime config
- `src/server/`
  database, auth, API helpers, observability, and service layer
- `src/types/`
  shared product-facing DTOs
- `prisma/`
  schema, migrations, and seed script
- `tests/`
  Vitest unit/component tests and existing node:test coverage
- `playwright/`
  end-to-end smoke tests

## Database Model

Core relational models:

- `User`
- `Workspace`
- `WorkspaceMember`
- `AuthSession`
- `Source`
- `MonitoredUpdate`
- `Insight`
- `ActivityEvent`
- `SavedView`
- `ResearchBrief`
- `ResearchReport`

This supports user-aware access, protected workspace boundaries, monitored sources, update ingestion, AI insight generation, activity history, and editorial workflows.

## Environment

Copy `.env.example` to `.env` and set values for your environment.

Required/important variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public
NEXT_PUBLIC_APP_URL=http://localhost:5050
LOG_LEVEL=info
AI_COMMAND_CONSOLE_AUTH_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=
AI_SUMMARY_PROVIDER_MODE=auto
AI_SUMMARY_MODEL=gpt-4.1-mini
AI_SUMMARY_DAILY_BUDGET_USD=1
AI_SUMMARY_ESTIMATED_COST_PER_RUN_USD=0.02
AI_SUMMARY_EVAL_ENABLED=true
JOB_QUEUE_EXECUTION_MODE=external
JOB_WORKER_POLL_INTERVAL_MS=2000
JOB_QUEUE_MAX_PENDING=100
JOB_QUEUE_MAX_RUNNING=12
AI_COMMAND_CONSOLE_DATA_ROOT=./.codex-temp/runtime-data
AI_COMMAND_CONSOLE_DATABASE_PATH=./.codex-temp/runtime-data/workspace.sqlite
AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH=./.codex-temp/runtime-data/agents/console.sqlite
AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS=false
AI_COMMAND_CONSOLE_SECURE_COOKIES=false
AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS=1209600
```

## Local Development

1. Install dependencies

```bash
npm install
```

2. Start Postgres locally

```bash
docker compose up -d
```

The default local Docker Postgres port for this repo is `55432` to avoid conflicts with other PostgreSQL installs already using `5432`.

For local development, point mutable runtime state at `./.codex-temp/runtime-data` so queue, telemetry, inbox, and workspace churn stays out of tracked fixture files under `data/`.

If local auth, health checks, or Prisma-backed pages fail, run:

```bash
npm run dev:doctor
```

That script tells you whether `DATABASE_URL` is valid, whether Postgres is reachable, and whether Docker is available for the local container workflow.

If you want a quick read on where mutable runtime state is currently landing and whether tracked legacy state files are still dirty, run:

```bash
npm run dev:state-report
```

That report is read-only. It shows the configured runtime data root, the isolated legacy test runtime root, and any dirty tracked files under `data/`, `agents/`, `memory/`, or `logs/`.

If you want to preserve the current dirty legacy state before cleaning it up by hand, run:

```bash
npm run dev:state-archive
```

That command is also non-destructive. It copies the currently dirty legacy state files into `./.codex-temp/legacy-state-archive/<timestamp>/` and writes a manifest so you can review exactly what was captured.

If you want a guided cleanup for the known runtime residue that historically leaked into tracked legacy paths, start with:

```bash
npm run dev:state-cleanup
```

That is a dry-run. It only plans cleanup for the known-safe residue list and skips anything else for manual review.

To actually apply that cleanup after taking an archive snapshot, run:

```bash
npm run dev:state-cleanup -- --apply
```

Apply mode restores tracked residue from `HEAD` and removes matching untracked residue, but still leaves any non-listed entries alone.

If you want a quick guardrail check without the fuller report, run:

```bash
npm run check:legacy-state
```

That command reports whether the known runtime residue set is dirty under tracked legacy paths. CI runs the same guard in strict mode after tests and build.

If you want the repo to try the full local setup path for you, run:

```bash
npm run dev:bootstrap
```

That command will:

- run the local doctor
- start the `postgres` Docker service when Docker is available
- wait for the database port to come up
- apply Prisma migrations
- seed demo data

To keep local setup safe, it refuses to run against non-local or non-`ai_command_console` databases. If you intentionally point `DATABASE_URL` at a shared environment, run `npm run db:deploy` and `npm run db:seed` manually instead.

For Windows machines without Docker, try:

```bash
npm run dev:postgres:windows
```

That helper will:

- check whether the host and port from `DATABASE_URL` are already reachable
- detect an installed PostgreSQL Windows service
- try to start that service when possible
- report the next step if PostgreSQL is not installed yet

3. Run Prisma migrations

```bash
npm run db:deploy
```

4. Seed demo data

```bash
npm run db:seed
```

Or do both in one step:

```bash
npm run db:reset:local
```

5. Start the app

```bash
npm run dev
```

For sustained load, keep background jobs outside the app process:

```bash
npm run worker:jobs
```

The safer production-style posture is:

- `JOB_QUEUE_EXECUTION_MODE=external`
- run `npm run worker:jobs` in a second process
- tune `JOB_QUEUE_MAX_PENDING` and `JOB_QUEUE_MAX_RUNNING` for the environment instead of letting the web app absorb unlimited work

The app runs at [http://localhost:5050](http://localhost:5050).

To rerun the queue hardening check against a live local app, use:

```bash
npm run stress:jobs
```

That script logs in with the seeded showcase admin, drives mixed reads plus queue pressure, waits for the queue to settle, and fails if polling, readiness, or settled memory cross the configured safety thresholds.

Demo credentials after seeding:

- email: `operator@pulse.local`
- password: `demo-password`

## Scripts

- `npm run dev`
- `npm run dev:doctor`
- `npm run dev:bootstrap`
- `npm run dev:state-report`
- `npm run dev:state-archive`
- `npm run dev:state-cleanup`
- `npm run check:legacy-state`
- `npm run dev:postgres:windows`
- `npm run worker:jobs`
- `npm run stress:jobs`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run test:unit`
- `npm run test:legacy`
- `npm run test:e2e`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:deploy`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:reset:local`
- `npm run db:studio`

## API Surface

Core routes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/dashboard`
- `GET /api/profile`
- `GET /api/workspace`
- `GET|PATCH /api/settings/workspace`
- `POST|DELETE /api/settings/invites`
- `GET /api/sources`
- `GET /api/updates`
- `GET /api/insights`
- `POST /api/insights`
- `GET|POST /api/jobs`
- `GET /api/activity`
- `GET|POST|PATCH|DELETE /api/research/briefs`
- `GET /api/research/briefs/[id]`
- `GET|POST|PATCH|DELETE /api/research/reports`

Response contract:

- success: `{ ok: true, data: ... }`
- failure: `{ ok: false, error: { code, message, details? } }`

## Auth And Authorization

- Credentials-based sign-in/sign-up
- Signed HTTP-only session cookie
- Database-backed `AuthSession` records
- Proxy-based protected route redirects
- Server-side workspace checks for protected data access
- Users only access their own workspace-scoped data unless explicitly elevated

## Observability

- structured server logging in `src/server/observability/logger.ts`
- AI provider boundary in `src/server/services/ai-service.ts`
- background job orchestration in `src/server/jobs/background-jobs.ts`
- environment-aware runtime posture reporting
- `/api/health` for liveness
- `/api/ready` for readiness

## Testing

Currently verified in this repo:

- `npm run verify`
- `npm run test:unit`
- `npm run test:legacy`
- `npm run build`
- `npm run check:legacy-state -- --strict`

`npm run verify` is the default contributor check. It runs lint, unit tests, legacy tests, production build, and the strict legacy-state guard in one pass.

Playwright coverage is configured, but it expects a running PostgreSQL instance and migrated seed data before execution.

Run browser smoke tests with:

```bash
npm run test:e2e
```

If browser tests fail on signup, health, or readiness, run `npm run dev:doctor` first. The most common local issue is Postgres not running on the host and port configured in `DATABASE_URL`.

## Deployment Assumptions

- frontend/app hosted on Vercel
- PostgreSQL provided by Neon, Supabase, RDS, Railway, or similar
- `DATABASE_URL` and `AI_COMMAND_CONSOLE_AUTH_SECRET` supplied by the platform
- migrations applied with `npm run db:deploy`
- seed data is optional and should not be used in production

## Recommended Next Steps

- add ingestion jobs for source refresh and external webhook/event intake
- expand workspace sharing and multi-workspace membership controls
- add request tracing and external log/metrics sinks
- broaden Playwright coverage for authenticated desktop and mobile flows
