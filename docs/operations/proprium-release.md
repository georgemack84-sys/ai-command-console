# Proprium Release and Deployment

## Release authority

`apps/web` and `services/api/Proprium.Api` are the production architecture. The
`Release Proprium` workflow builds both images from one commit and publishes them
to GitHub Container Registry with an immutable commit-SHA tag and a movable
environment tag. The workflow requires a target environment and the public API
URL that must be embedded in the frontend build.

The root Next.js application is transitional. Its `Legacy Deployment (manual
only)` workflow cannot run from CI completion and must not be used as the normal
Proprium release path.

## Release procedure

1. Ensure the commit is on the protected `main` branch for a production release.
2. Run `Release Proprium` and supply `staging` or `production` plus the public,
   absolute API base URL.
3. Deploy `ghcr.io/<owner>/proprium-api:<commit-sha>` once with `--migrate` as a
   release task. Do not run migrations concurrently from every API replica.
4. Roll out that API image and wait for `/api/v1/health/ready`.
5. Roll out `ghcr.io/<owner>/proprium-web:<commit-sha>`.
6. Verify readiness, login, refresh, logout, and revoked-session behavior before
   promoting traffic.

Both images include BuildKit provenance and SBOM attestations. Retain the commit
SHA in deployment records so rollback selects an immutable pair of images.

## Staging rollout authority

`Deploy Proprium Staging` is the only workflow that rolls the published Proprium
images onto the configured staging host. It is manual, staging-only, and requires
an immutable 40-character commit SHA that was previously published by `Release
Proprium`. It never reads, writes, or logs application secrets in GitHub.

Before its first run, provision these host-local files under
`<DEPLOY_PATH>/proprium` (currently `/srv/ai-command-console/staging/proprium`):

- `runtime.env`: the API's untracked runtime environment, including PostgreSQL,
  Redis, session-key, and allowed-origin settings;
- `compose.env`: non-secret Compose wiring with `PROPRIUM_RUNTIME_ENV_FILE`,
  `PROPRIUM_RUNTIME_NETWORK`, `PROPRIUM_API_BIND`, and `PROPRIUM_WEB_BIND`;
- a pre-existing external Docker network named by `PROPRIUM_RUNTIME_NETWORK`;
- Docker credentials that can pull the private GHCR Proprium images.

The workflow copies only the tracked deployment manifest, writes a restrictive
per-release image-tag file on the host, pulls immutable API and web images, runs
the API migration task exactly once, waits for the API Docker health check, and
then starts the web image. A failed migration or readiness check prevents the web
rollout. The host-local runtime files remain operator-owned and are never copied
into the repository or action logs.

## Legacy autonomy quarantine

Production execution of the transitional digest scheduler, watcher, agent
scheduler, and external root job worker is disabled by default. A temporary
legacy deployment requires both:

```text
LEGACY_AUTONOMOUS_EXECUTION_ENABLED=true
LEGACY_AUTONOMOUS_EXECUTION_RISK_ACCEPTED=true
```

Never set only one flag. Enabling both is an explicit risk acceptance for the
unmigrated execution paths documented by the runtime audit. Local development and
tests remain available so migration work can continue. Proprium images do not use
these flags or legacy execution paths.
