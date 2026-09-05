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
  Redis, session-key, and allowed-origin settings. The recommended bootstrap
  mode generates this file on the host for the isolated Proprium state stack;
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

### Staging host bootstrap without interactive SSH

When a staging operator cannot connect interactively to the host, use the
staging-environment workflows instead of opening SSH to the internet:

1. Run `Diagnose Proprium Staging Host`. It uses the existing protected deploy
   key to report Docker networks, running container names/images/networks,
   listening TCP endpoints, reverse-proxy service/configuration metadata, and a
   filtered Nginx route map (`listen`, `server_name`, `proxy_pass`, `root`, and
   `try_files` directives only), deployment-directory metadata, and tool
   availability. It does not read environment-file contents, Docker credentials,
   or application configuration values.
2. Choose an existing external Docker network and two unused loopback **port
   mappings**: `127.0.0.1:18080:8080` for the API and
   `127.0.0.1:18081:3000` for the web application. The final port is the fixed
   container port; the middle port is the available host port. Route public
   traffic through the host's existing reverse proxy; do not expose these
   container ports directly.
3. Run `Bootstrap Proprium Staging Host` with `runtime_source` set to
   `generate_isolated` (the default). It creates a dedicated `proprium-postgres`
   database with persistent storage and a private `proprium-redis` cache on the
   chosen Docker network. It generates the database, cache, and application-key
   material directly on the host; those values never cross a workflow input or
   action log. This mode does not alter the legacy PostgreSQL container.
4. Use `operator_provided` only when an operator must connect Proprium to
   externally managed state. In that case, add the multiline
   `PROPRIUM_RUNTIME_ENV` secret in GitHub **Settings → Environments → staging
   → Environment secrets**. Its value is the complete host-only `runtime.env`
   content for Proprium, not a single random value. Do not commit or paste that
   content into an issue, pull request, or workflow input. Supply every required
   assignment (with real staging values, no angle brackets or quotes):

   ```text
   ASPNETCORE_ENVIRONMENT=Staging
   POSTGRES_HOST=<reachable-postgres-host-or-network-alias>
   POSTGRES_PORT=5432
   POSTGRES_DATABASE=<database-name>
   POSTGRES_USER=<database-user>
   POSTGRES_PASSWORD=<database-password>
   REDIS_HOST=<reachable-redis-host-or-network-alias>
   REDIS_PORT=6379
   REDIS_PASSWORD=<redis-password-if-required>
   SESSION_TOKEN_DIGEST_KEY=<base64-key-with-at-least-32-decoded-bytes>
   SESSION_LIFETIME_MINUTES=480
   LOGIN_RATE_LIMIT_PRIVACY_KEY=<base64-key-with-at-least-32-decoded-bytes>
   AUTH_ALLOWED_ORIGIN=https://34.45.207.173.sslip.io
   ```

   The bootstrap workflow validates this structure, key presence, port ranges,
   origins, and key encoding without printing any values. It refuses to write a
   malformed file to the host.
5. Run `Bootstrap Proprium Staging Host` with the network and bindings. It
   creates the files at mode `0600` and refuses to replace existing files unless
   `replace_existing_files` is explicitly selected.
6. Confirm the host has Docker credentials capable of pulling private GHCR
   images, then use the normal release and rollout procedure above.

Both workflows are manual, staging-only, and use the same protected deployment
key as the rollout workflow. They provide a controlled recovery path but do not
make an internet-accessible SSH service necessary.

### Reverse-proxy cutover

The isolated API and web services bind only to host loopback ports. Before public
traffic moves from the legacy application, use `Diagnose Proprium Staging Host`
to identify the active reverse-proxy implementation and its configuration path.
Do not replace an unknown host proxy configuration. A cutover must be reviewed,
reversible, and route the public web origin to the Proprium web loopback port and
the API prefix to the Proprium API loopback port.

The diagnostic uses non-interactive `sudo` only to inspect the effective Nginx
route directives. A deployment cutover additionally needs a restricted privilege
grant for `nginx -t`, installing its reviewed include, and reloading Nginx.

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
