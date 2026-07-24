# Authentication and Session Design

## Authority and token handling

PostgreSQL is the sole authority for users, sessions, revocation, expiry, security-version snapshots, roles, and permissions. Redis is not consulted by login, session validation, logout, or current-user resolution.

Sessions use a 32-byte cryptographically random opaque token, encoded as unpadded base64url. The client receives it only through the session cookie. PostgreSQL stores only an HMAC-SHA-256 digest derived with `SESSION_TOKEN_DIGEST_KEY`; no raw token, password, or password hash is included in events, API responses, or application logging.

## Cookie and request policy

Production uses `__Host-proprium_session`; local development uses `proprium_session`. Both are `HttpOnly`, `SameSite=Lax`, and `Path=/`, with no Domain attribute. Production cookies are Secure; local HTTP development cookies are not. Session lifetime is configured by `SESSION_LIFETIME_MINUTES` and server-side expiry is authoritative.

State-changing authentication requests require an exact `Origin` match to `AUTH_ALLOWED_ORIGIN` and a non-empty `X-Proprium-CSRF` header. Authentication endpoints send `Cache-Control: no-store`. JSON request bodies reject unknown members.

## Lifecycle and evidence

Login always returns either `204 No Content` with the cookie or a generic `401 Unauthorized`. A password requiring rehash is updated within the same transaction as session creation and audit events; the cookie is issued only after commit. Logout revokes the PostgreSQL session idempotently and clears the cookie.

Expired rows remain retained as evidence. `ExpireStaleSessions` identifies expired, unrevoked records without changing the validity rule or deleting evidence. Physical cleanup requires a later approved retention policy.

The documented HTTP contract is `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, and `POST /api/v1/auth/logout`. Login and logout have `204` responses with no JSON schema or response body; the current-user response is limited to identifier, username, display name, roles, and effective permissions.
