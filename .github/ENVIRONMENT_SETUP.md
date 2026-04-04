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
- `AI_COMMAND_CONSOLE_STORAGE_DRIVER=sqlite`
- `AI_COMMAND_CONSOLE_DATABASE_PATH`
- `AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH`
- `AI_COMMAND_CONSOLE_SECURE_COOKIES=true`
- `AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS`
- `AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL`

## Inventory Helper

Print the expected inventory with:

```bash
npm run deployment:inventory
```

Or for one environment:

```bash
npm run deployment:inventory -- staging
```
