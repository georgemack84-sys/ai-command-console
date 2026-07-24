# Authentication and Session Design

## Authority and token handling

PostgreSQL is the sole authority for users, sessions, revocation, expiry, security-version snapshots, roles, and permissions. Redis never authenticates a request, determines whether a session is current, or independently grants access. It may hold a derived effective-permission cache keyed by `authz:permissions:{userId}:{securityVersion}` for at most 60 seconds; a cache miss, corrupt value, or Redis outage resolves permissions from PostgreSQL. A cache hit never skips PostgreSQL session and user-state validation.

Sessions use a 32-byte cryptographically random opaque token, encoded as unpadded base64url. The client receives it only through the session cookie. PostgreSQL stores only an HMAC-SHA-256 digest derived with `SESSION_TOKEN_DIGEST_KEY`; no raw token, password, or password hash is included in events, API responses, or application logging.

## Cookie and request policy

Production uses `__Host-proprium_session`; local development uses `proprium_session`. Both are `HttpOnly`, `SameSite=Lax`, and `Path=/`, with no Domain attribute. Production cookies are Secure; local HTTP development cookies are not. Session lifetime is configured by `SESSION_LIFETIME_MINUTES` and server-side expiry is authoritative.

State-changing authentication requests require an exact `Origin` match to `AUTH_ALLOWED_ORIGIN` and exactly one `X-Proprium-CSRF: 1` header. Authentication endpoints send `Cache-Control: no-store`. Login reads at most 4,097 bytes and rejects unknown, duplicate, or case-conflicting JSON properties.

Login abuse control applies a locked five-minute window: 10 attempts per direct source and 5 attempts per normalized identifier/source pair. Redis performs the increment and expiry as one atomic Lua operation; when Redis is unavailable, a bounded in-process limiter preserves minimum protection. Source and identifier values are HMAC-derived before they become Redis keys. Login outcome order is `429` rate limit, then `403` origin/CSRF, then `400` request validation, then `401` credential rejection, then `204` success.

Protected endpoints declare canonical typed permission references. Role names are returned only as identity context and never substitute for permission checks. Security-affecting role or role-permission changes increment the affected users' security versions transactionally, emit immutable invalidation audit events, and cause prior session snapshots to fail before a cached permission set can be used.

## Lifecycle and evidence

Login returns `204 No Content` with the cookie only after successful authentication; credential rejection is the generic `401 Unauthorized`, while policy, validation, and rate-limit outcomes follow the ordered contract above. A password requiring rehash is updated within the same transaction as session creation and audit events; the cookie is issued only after commit. Logout revokes the PostgreSQL session idempotently and clears the cookie. Malformed, duplicate, expired, revoked, disabled, and security-version-mismatched session cookies are rejected and record safe audit evidence without allowing audit persistence failures to turn into a successful request.

Expired rows remain retained as evidence. `ExpireStaleSessions` identifies expired, unrevoked records without changing the validity rule or deleting evidence. Physical cleanup requires a later approved retention policy.

The documented HTTP contract is `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, and `POST /api/v1/auth/logout`. Login and logout have `204` responses with no JSON schema or response body; the current-user response is limited to identifier, username, display name, roles, and effective permissions.
