# Staging Rollout Checklist

Use this checklist for the first real staging deployment.

## 1. Prepare GitHub Environment

- Create the `staging` GitHub Environment.
- Fill in values from `.github/environment-templates/staging.env.example`.
- Add the `DEPLOY_SSH_KEY` secret.
- Confirm `DEPLOY_ARTIFACT_ONLY=false` unless you intentionally want an artifact-only dry run.

Quick inventory:

```bash
npm run deployment:inventory -- staging
```

## 2. Prepare Target Host

- Ensure the target host has a deploy user with access to `DEPLOY_PATH`.
- Create the shared writable directories used by your runtime env.
- Configure the app runtime environment on the host:
  - `AI_COMMAND_CONSOLE_AUTH_SECRET`
  - `DATABASE_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `AI_COMMAND_CONSOLE_STORAGE_DRIVER=sqlite`
  - `AI_COMMAND_CONSOLE_DATABASE_PATH`
  - `AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH`
  - `AI_COMMAND_CONSOLE_SECURE_COOKIES=true`
  - `AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS`
  - `AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL`
- Make sure the restart command in `DEPLOY_RESTART_COMMAND` works on the host.

## 3. Dry-Run Checks Before Rollout

- Confirm `main` is the branch you want to stage.
- Confirm local checks are green:

```bash
npm run verify
```

- Confirm the deploy contract is valid in GitHub Actions or locally with matching env:

```bash
npm run validate:deploy-config
```

## 4. Trigger Staging Deployment

Expected trigger:

- push to `main` and let successful `CI` auto-trigger the staging deploy

Optional manual trigger:

- run the `Deploy` workflow with `target_environment=staging`

## 5. Watch For Success Signals

In GitHub Actions:

- `Validate deploy configuration` passes
- `Run preflight` passes
- `Lint`, `Test`, `Build standalone bundle`, and `Guard Legacy Runtime Residue` pass
- `Deploy over SSH` passes
- `Post-deploy smoke check` passes
- deployment summary shows the expected release version and host

In the app:

- `GET /api/health` returns `200`
- `GET /api/ready` returns `200`
- `/auth` loads successfully
- `/settings` loads and shows workspace/invite state
- `/platform` shows healthy deployment posture
- runtime diagnostics do not show new high-severity failures
- active alerts do not show runtime readiness/liveness failures after rollout stabilizes

## 6. Immediate Post-Deploy Review

- Confirm the release exists under `<DEPLOY_PATH>/releases/<release-version>`.
- Confirm `<DEPLOY_PATH>/current` points to the new release.
- Confirm the shared SQLite paths are writable and present.
- Confirm logs are being written.
- Confirm the alert webhook destination receives test notifications if configured.

## 7. Roll Back If Needed

If the staging deploy is unhealthy and does not recover quickly:

1. Find the previous known-good release version from the deploy summary or the remote `releases/` directory.
2. Trigger the `Deploy` workflow manually with:
   - `target_environment=staging`
   - `rollback_release=<previous-release-sha>`
3. Recheck:
   - `/api/health`
   - `/api/ready`
   - `/platform`

## 8. Exit Criteria

Staging is considered healthy when all are true:

- deploy workflow completed successfully
- `/api/health` and `/api/ready` are both `200`
- the platform diagnostics panel has no new recurring high-severity runtime events
- active runtime alerts are absent or acknowledged and understood
- operators can log in and reach `/console`, `/operations`, and `/platform`
- workspace owners can reach `/settings`
