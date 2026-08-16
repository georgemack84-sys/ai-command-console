# Proprium API

The canonical environment inventory is `services/api/.env.example`; required, optional, sensitive, and conditional settings are documented in the [configuration guide](../../docs/onboarding/configuration.md).

API startup resolves the complete provider snapshot through
`Proprium.Api.Configuration.ApiConfiguration` before building the service
provider. Application metadata, PostgreSQL, Redis, sessions, authentication,
rate limiting, and local-administrator configuration are registered as narrow,
effectively immutable typed dependencies. Application and domain code must not
read `IConfiguration` or process environment values. Provider-native builders
construct PostgreSQL and Redis client configuration without logging credentials.
See the [GP-31 backend configuration contract](../../docs/engineering/gp-31-backend-typed-configuration.md).

Provider composition is explicit and static: `appsettings.json`, optional
environment-specific JSON, process environment, the reserved deployment-secret
slot, and allowlisted non-secret command-line overrides. Lower sources win.
Development User Secrets and backend `.env` files are not loaded automatically,
and secret-shaped CLI configuration is rejected. See the
[GP-32 precedence contract](../../docs/engineering/gp-32-configuration-sources-and-precedence.md).

The backend is a .NET 8 layered solution. From the repository root, restore and
run its canonical infrastructure-independent qualification with:

```bash
npm run repo -- bootstrap
npm run repo -- validate backend
npm run repo -- validate authentication-core
npm run backend:test:unit
```

Start the supported local API together with its PostgreSQL, Redis, migration, and
frontend dependencies through `npm run repo -- dev`; verify it with `npm run repo
-- health`. The actual Compose service is `platform-api`. See the
[developer setup](../../docs/onboarding/developer-setup.md) and
[migration guide](../../docs/operations/migrations.md).

The canonical compiler/analyzer sequence is infrastructure-independent:

```bash
dotnet restore services/api/Proprium.sln
dotnet build services/api/Proprium.sln --configuration Release --no-restore --nologo
npm run validate:backend-compiler
```

The build must finish with zero warnings and zero errors. The [GP-08 backend compiler specification](../../docs/engineering/gp-08-backend-compiler-standards.md) defines nullable analysis, warnings-as-errors, the fixed .NET 8 analyzer baseline, generated-code handling, and the suppression policy.

After the Release build, run `npm run validate:backend-architecture` to verify the project graph, package isolation, compiled layer and namespace boundaries, and dependency-resolution rules without rebuilding or starting infrastructure. The [GP-10 backend architecture specification](../../docs/engineering/gp-10-backend-architecture.md) records the canonical dependency matrix, controlled negative fixtures, and narrow composition-boundary exceptions.

Run `npm run validate:backend-test-classification` after the build to prove every xUnit test has one valid Unit, Architecture, or Integration category without starting infrastructure. Use `npm run backend:test:unit`, `npm run backend:test:architecture`, and `npm run backend:test:integration` to select each suite; only the Integration execution command requires its external services. The [GP-11 classification specification](../../docs/engineering/gp-11-integration-test-classification.md) defines the marker, approved evidence, filter contract, and negative fixtures.

Apply canonical backend formatting with `npm run backend:format` and verify it without changing files with `npm run backend:format:check`. `npm run backend:format:verify` proves drift detection, correction, non-mutation, and idempotence with a disposable project. The [GP-09 backend formatting specification](../../docs/engineering/gp-09-backend-formatting.md) defines the `.editorconfig` policy, solution target, generated-code ownership, and separation from analyzer auto-fixes.

The platform endpoints are `/api/v1`, `/api/v1/health`, `/api/v1/health/live`, and `/api/v1/health/ready`. OpenAPI is at `/openapi/v1.json`; Swagger UI is available in Development only.

The [GP-26 backend authentication specification](../../docs/engineering/gp-26-backend-authentication-core.md)
freezes password verification, opaque session issuance and validation, cookie
policy, authentication events, and the protected OpenAPI contract.

## Week 3 identity foundation

PostgreSQL is the sole authority for users, roles, permissions, sessions, security versions, and authentication events. Redis is never an identity, permission, or session-validity authority. All persisted identity timestamps use UTC `DateTimeOffset`; every identity record uses a stable GUID; and authenticated-event records are immutable after persistence. Deletion relationships are restrictive, favoring explicit revocation and retention over cascaded removal.

Usernames and role names are normalized with trimmed invariant uppercase through `IdentityNormalization`; callers must persist both the display/login value and the normalized value. Permission keys are lowercase, dot-separated canonical identifiers of the form `capability.resource.action` and are immutable compatibility-sensitive authorization identifiers.

Session records contain only a bounded token lookup digest—never a raw token—and a security-version snapshot. `SessionFactory` is the canonical Day 1 creation path: it captures the current user version and accepts only UTC creation/expiry timestamps and a non-plaintext token digest. `SessionTokenDigest` uses keyed HMAC-SHA-256 with a cryptographically random key of at least 32 bytes; the key must be supplied from the approved secret provider when session issuance is introduced. Password hashing is never used for token lookup. A session is invalid whenever its immutable snapshot differs from the current user security version.

### Permissions and seeds

`Proprium.Domain.Identity.PermissionCatalog` is the sole canonical permission source. It is version-controlled, explicit, ordinally ordered, and used directly by both the seed process and exporter. Export it without starting PostgreSQL, Redis, or the API:

```text
make export-permissions
```

`services/api/permissions.json` is a committed generated artifact. CI regenerates it and fails if it drifts. Add or retire permissions by changing the catalog and reviewing the resulting export and explicit baseline mappings; do not create a second list of permission definitions in the frontend, migrations, or seed code.

`make migrate` applies migrations and idempotently seeds the Administrator and Member roles. Administrator receives the full approved catalog; Member receives only authenticated access, self-profile read, and self-session management. `make reset-db` deliberately removes the named local PostgreSQL volume and reapplies the Compose workflow; it is destructive and must never target a shared database.

### Security version and local administrator

`SecurityVersion` starts at `1`. Role assignment and removal increment the affected user atomically; a role-permission change increments each assigned user exactly once in the same transaction. If every affected user cannot be updated, the authorization change rolls back. Old session snapshots are never changed to restore validity.

Set `LOCAL_ADMIN_ENABLED=true`, `LOCAL_ADMIN_USERNAME`, and the secret-bearing `LOCAL_ADMIN_PASSWORD` only in Development before running `make migrate` to create a local administrator. The password is hashed through ASP.NET Core Identity before persistence. Repeating initialization retains the existing account and Administrator assignment; it does not rotate the password. Missing credentials fail without creating a user. Any enabled local-administrator configuration outside Development is rejected before initialization.

### Day 3 request security

Protected requests validate the opaque session against PostgreSQL on every request, then resolve canonical effective permissions. Redis is advisory only: it can cache a derived permission set for up to 60 seconds at `authz:permissions:{userId}:{securityVersion}`, but it cannot authenticate a session or grant access by itself. Cache misses, corruption, and Redis outages fall back to PostgreSQL; a security-version mismatch fails before permission-cache use.

Authentication mutations require the exact `AUTH_ALLOWED_ORIGIN` and exactly one `X-Proprium-CSRF: 1` header. Login rate limiting is locked to 10 direct-source attempts and 5 normalized identifier/source attempts per five-minute window. Redis performs counter increment plus expiry atomically; the bounded in-process fallback remains active if Redis is unavailable. The login response order is `429`, `403`, `400`, `401`, then `204`.

Use canonical `PermissionCatalog` definitions with `RequirePermission(...)`; do not use role-name checks or ad hoc permission strings. Role and permission changes increment affected security versions transactionally, record invalidation evidence, and invalidate old session snapshots immediately.
