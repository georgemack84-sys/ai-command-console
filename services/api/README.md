# Proprium API

The canonical environment inventory is `services/api/.env.example`; required, optional, sensitive, and conditional settings are documented in the [configuration guide](../../docs/onboarding/configuration.md).

The backend is a .NET 8 layered solution. Run the complete qualification suite with:

```bash
dotnet test services/api/Proprium.sln
dotnet build services/api/Proprium.sln
docker compose build api
docker compose up api
```

The platform endpoints are `/api/v1`, `/api/v1/health`, `/api/v1/health/live`, and `/api/v1/health/ready`. OpenAPI is at `/openapi/v1.json`; Swagger UI is available in Development only.

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
