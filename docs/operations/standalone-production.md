# Standalone production runbook

This runbook is for a single-node standalone deployment of AI Command Console and Noesis. It uses the same startup governor exercised in the local production shakedown.

## Configure secrets and persistent storage

Start from [`.env.production.example`](../../.env.production.example), but place the actual values in your host or secret manager instead of copying secrets into a file tracked by Git.

`AI_COMMAND_CONSOLE_AUTH_SECRET` must be a cryptographically random value and must remain unchanged across restarts. Changing it invalidates all existing sessions. `ADMIN_SECRET` must be a different random secret. Keep the SQLite files and logs on durable storage that survives deployments.

Generate an authentication secret in PowerShell with:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

## Build and start

From the repository root, with production configuration already present in the environment:

```powershell
npm ci
npm run db:deploy
npm run build
npm run start:standalone
```

The standalone server prints its bound address. Keep it supervised by the platform's process manager; the terminal session is only suitable for the local shakedown. If jobs are enabled, start a separate worker with the same environment and durable data root:

```powershell
npm run worker:jobs
```

For multiple web instances, use a shared database/storage design and retain `JOB_QUEUE_EXECUTION_MODE=external` so only workers consume jobs.

## Verify the deployment

Before exposing the service, confirm the startup output reports `"ok": true` and an empty `problems` array. Then verify:

1. `/auth` loads and a newly created account can sign in.
2. `/dashboard` displays the signed-in email consistently in the account chip and user summary.
3. `/api/ready` and `/api/health` return healthy responses through the intended HTTPS endpoint.
4. A Noesis teaching event, provenance query, and approval flow work for an authorized account.
5. A backup and restore simulation complete successfully; keep continuity verification current.

The alert webhook is optional for local operation, but configure `AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL` before relying on unattended production alerts.

## Build-lock recovery

Next prevents concurrent builds and may leave its generated lock after an interrupted process. First identify and stop the exact standalone or build process that owns the lock. Only after confirming no build is running, remove the generated lock and rerun `npm run build`. Never remove a lock while a build is active, and do not delete source or persistent data directories as part of lock recovery.
