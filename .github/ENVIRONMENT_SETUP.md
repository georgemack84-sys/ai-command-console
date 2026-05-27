# GitHub Environment Setup

This repo expects two GitHub Environments:

- `staging`
- `production`

Use the templates in `.github/environment-templates/` when filling in variables and app runtime settings.

## Staging

Recommended behavior:

- auto-deploy from successful `main` CI runs
- allow artifact-only mode only if you intentionally do not have a remote host yet
- use a non-production webhook destination for alert testing

Required GitHub Environment secret:

- `DEPLOY_SSH_KEY`

Required GitHub Environment variables:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PATH`

Strongly recommended variables:

- `DEPLOY_PORT`
- `DEPLOY_RESTART_COMMAND`
- `DEPLOY_HEALTHCHECK_URL`
- `DEPLOY_VALIDATION_PATHS`
- `DEPLOY_RELEASE_RETENTION`

## Production

Recommended behavior:

- manual deploy only
- required reviewers enabled
- never use `DEPLOY_ARTIFACT_ONLY=true`
- use the real operator alert webhook

Required GitHub Environment secret:

- `DEPLOY_SSH_KEY`

Required GitHub Environment variables:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PATH`

Strongly recommended variables:

- `DEPLOY_PORT`
- `DEPLOY_RESTART_COMMAND`
- `DEPLOY_HEALTHCHECK_URL`
- `DEPLOY_VALIDATION_PATHS`
- `DEPLOY_RELEASE_RETENTION`

## Host Runtime

Your target host still needs the app runtime environment configured outside GitHub Actions:

- `AI_COMMAND_CONSOLE_AUTH_SECRET`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `AI_COMMAND_CONSOLE_STORAGE_DRIVER=sqlite`
- `AI_COMMAND_CONSOLE_DATABASE_PATH`
- `AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH`
- `AI_COMMAND_CONSOLE_SECURE_COOKIES=true`
- `AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS`
- `AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL`

The build uses Next.js standalone output. Production hosts should start the web process with the guarded standalone command:

```bash
npm run start:standalone
```

The underlying runtime entrypoint is `.next/standalone/server.js`; the package script preserves preflight and startup-governor validation before launching it. Use absolute SQLite paths on hosts, or rely on the local guarded wrapper to resolve relative app storage paths before the standalone server changes its working directory. Keep the job worker attached in a separate process:

```bash
npm run worker:jobs
```

Use `GET /api/health` for liveness, `GET /api/ready` for readiness, and the worker attachment diagnostic before routing traffic. `npm run start` is retained as a local/legacy `next start` path, but it is not the recommended deployment command when standalone output is enabled.

## Inventory Helper

Print the expected inventory with:

```bash
npm run deployment:inventory
```

Or for one environment:

```bash
npm run deployment:inventory -- staging
```
