# AI Command Console

AI Command Console is a Next.js workspace for operating a multi-agent command console with a built-in research desk and operations tooling.

## Current Product Shape

- Browser console with live overview, command execution, workflow actions, alerts, approvals, and job activity
- Research desk for briefs, reports, digests, queue routing, and operator collaboration
- Agent runtime services for planner, builder, manager, and researcher roles
- SQLite-backed operational state with legacy JSON write-through compatibility
- Environment-aware authentication and workspace persistence with a production SQLite posture

## Production-Oriented Status

Verified in this workspace:

- `npm run lint` passes
- `npm test` passes
- `npm run build` passes

Important caveats:

- The console services still include some legacy file-backed subsystems outside the main auth/workspace store
- Production should run with an explicit auth secret and storage configuration

## Deployment Contract

Production deployment should assume:

- `NODE_ENV=production`
- `AI_COMMAND_CONSOLE_AUTH_SECRET` is required
- `AI_COMMAND_CONSOLE_STORAGE_DRIVER=sqlite`
- `AI_COMMAND_CONSOLE_DATABASE_PATH` points at a persistent writable volume
- `AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH` also points at persistent storage
- `.env` itself should not be the secret source in managed hosting unless that is your platform standard

Health endpoints:

- `GET /api/health`
  Use for liveness. Confirms the process can respond and expected runtime directories are present.
- `GET /api/ready`
  Use for readiness. Confirms the production auth/runtime contract and required SQLite files are available.

Recommended platform expectations:

- Back up both SQLite files on a schedule
- Mount `data/` and `logs/` on persistent storage
- Treat a non-200 response from `/api/ready` as “do not receive traffic”
- Run `npm run preflight` before accepting traffic or during startup hooks

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
npm run dev
```

3. Open the local app

```text
http://localhost:5050
```

## Environment Variables

Create a `.env` file for auth, persistence, and any optional external integrations you keep.

```bash
AI_COMMAND_CONSOLE_AUTH_SECRET=replace-this-in-real-use
AI_COMMAND_CONSOLE_STORAGE_DRIVER=sqlite
AI_COMMAND_CONSOLE_DATABASE_PATH=./data/workspace.sqlite
AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH=./data/agents/console.sqlite
AI_COMMAND_CONSOLE_SECURE_COOKIES=true
AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL=
```

## Key Routes

- `/console`
- `/operations`
- `/briefs`
- `/reports`
- `/platform`
- `/auth`
- `/`
- `/api/health`
- `/api/ready`

## Verification

Run the core production checks:

```bash
npm run preflight
npm run lint
npm test
npm run build
```

CI runs the same gate in GitHub Actions on pushes to `main`, `codex/**`, and on pull requests.

## Deployment Workflow

The repo now includes a production-minded GitHub Actions deploy workflow in `.github/workflows/deploy.yml`.

What it does:

- automatically deploys to the `staging` environment after the `CI` workflow passes on `main`
- reruns `preflight`, `lint`, `test`, and `build`
- creates a standalone Next.js deployment bundle
- uploads a versioned release artifact named `ai-command-console-release-<commit-sha>.tgz`
- supports manual environment-targeted deploys (`staging` or `production`)
- optionally deploys that bundle over SSH if deployment variables and secrets are configured
- runs a post-deploy smoke check against the target service
- supports manual production rollback by repointing the live release to an earlier deployed version

Repository variables for SSH deployment:

- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_PATH`
- `DEPLOY_RESTART_COMMAND` (optional)
- `DEPLOY_HEALTHCHECK_URL` (optional)
- `DEPLOY_HEALTHCHECK_PATH` (optional, defaults to `/api/ready`)
- `DEPLOY_HEALTHCHECK_ATTEMPTS` (optional)
- `DEPLOY_HEALTHCHECK_DELAY_SECONDS` (optional)
- `DEPLOY_VALIDATION_PATHS` (optional comma-separated list, defaults to `/api/health,/api/ready,/auth`)
- `DEPLOY_RELEASE_RETENTION` (optional, defaults to `5`)
- `DEPLOY_ARTIFACT_ONLY` (optional, defaults to unset; set to `true` only when you intentionally want artifact generation without a remote deploy)

Repository secret:

- `DEPLOY_SSH_KEY`

If those deployment settings are not configured, the workflow still produces the release artifact without attempting a remote deploy.

The workflow now validates the deployment contract before packaging or rollout. Staging and production expect the remote deployment settings to be present unless `DEPLOY_ARTIFACT_ONLY=true` is explicitly set on that environment. Production should not use artifact-only mode.

For operator notification, the app can optionally post critical runtime alerts to `AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL`. By default only `high` and `critical` alerts notify, and outbound notifications are throttled per alert type.

After a remote deploy, the workflow now runs a reusable validation script against the deployed service. By default it checks `http://127.0.0.1:3000/api/health`, `http://127.0.0.1:3000/api/ready`, and `http://127.0.0.1:3000/auth`. You can override the base URL with `DEPLOY_HEALTHCHECK_URL` and the path list with `DEPLOY_VALIDATION_PATHS`. `DEPLOY_HEALTHCHECK_PATH` still works as a compatibility override for a single path.

Remote deploy layout:

- releases are unpacked into `<DEPLOY_PATH>/releases/<release-version>`
- the live app should run from `<DEPLOY_PATH>/current`
- new deploys atomically repoint `current` to the new release directory
- manual rollback repoints `current` to an older release directory without rebuilding
- after a successful deploy and smoke check, older release directories are pruned while keeping the current release and the most recent retained releases

Recommended GitHub setup:

- Create a `staging` environment and a `production` environment in GitHub
- Put environment-specific variables and secrets on those environments
- Let `staging` deploy automatically from successful `main` CI runs
- Add required reviewers to the `production` environment for manual approval
- Trigger the deploy workflow manually with `target_environment=production` only from `main`
- For rollback, trigger the deploy workflow manually with `target_environment=production` and `rollback_release=<previous-release-sha>`
- Set `DEPLOY_ARTIFACT_ONLY=true` only for environments where you explicitly want bundle creation without remote rollout

Environment setup helpers:

- inventory script: `npm run deployment:inventory`
- setup guide: `.github/ENVIRONMENT_SETUP.md`
- templates: `.github/environment-templates/staging.env.example` and `.github/environment-templates/production.env.example`
- staging rollout runbook: `.github/STAGING_ROLLOUT.md`

## Backup And Restore

Back up the SQLite files:

```bash
npm run backup:sqlite
```

Back up into a specific directory:

```bash
node scripts/backup-sqlite.cjs ./backups/manual-restore-point
```

Restore from a backup directory:

```bash
npm run restore:sqlite -- ./backups/manual-restore-point
```

Verify a backup before restore:

```bash
npm run verify:backup -- ./backups/manual-restore-point
```

Recommended recovery flow:

1. Stop the app.
2. Take a final copy of the current `data/` directory.
3. Run `npm run verify:backup -- <backup-directory>`.
4. Run the restore script with the chosen backup directory.
5. Run `npm run preflight`.
6. Start the app and confirm `/api/ready` returns `200`.

Backup notes:

- each backup now includes `backup-manifest.json` with source and destination details
- restore now refuses backups that fail SQLite integrity checks
- the SQLite stores record simple schema metadata so future migrations have a version anchor

Alerting notes:

- critical runtime alerts now surface in the in-app alerts workflow automatically
- if `AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL` is configured, high-severity runtime alerts can also be delivered to an external webhook
- webhook delivery is throttled with `AI_COMMAND_CONSOLE_ALERT_WEBHOOK_THROTTLE_SECONDS` to reduce duplicate paging during outages

## Strong-Base Checklist

- Console API and workflow tests are green
- Production build completes successfully
- Streaming console route no longer crashes on closed connections
- Nested project folders have been removed from the workspace
- Generated build output and archive artifacts are now ignoreable

## Next Hardening Moves

- Initialize the main workspace as a git repository if this is the canonical project root
- Finish migrating the remaining legacy service stores behind the same environment-aware persistence layer
- Add post-deploy rollback support or release version tagging around deploy artifacts
