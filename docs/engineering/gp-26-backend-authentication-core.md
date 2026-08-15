# GP-26 Backend Authentication Core

## Scope and decisions

GP-26 qualifies the existing backend authentication path instead of introducing
a parallel identity system. PostgreSQL is authoritative for credentials, users,
sessions, revocation, expiry, security versions, roles, permissions, and audit
events. Redis provides abuse-control counters and optional derived permission
caching only; authentication correctness cannot depend on it.

Authentication establishes identity. Authorization remains the next milestone.
No role-name authorization API, sliding renewal, session cleanup job, token
exposure, or alternate browser session authority is introduced here.

## Password verification

`UserPasswordHasher` contains ASP.NET Core Identity's password hasher and maps
framework results to the application-owned `Failed`, `Success`, and
`RehashNeeded` outcomes. Unknown users still execute verification against a
dummy hash to reduce identifier timing differences. A required rehash, the user
security-version update, session creation, and authentication events share one
database transaction; the cookie is issued only after commit.

## Session token contract

`SessionTokenGenerator` obtains 32 bytes from the platform cryptographic random
number generator and encodes them as unpadded base64url. The raw token is a
redacting value object and exists only long enough to reach the response cookie.
`SessionTokenDigest` applies HMAC-SHA-256 with a secret key of at least 32 bytes.
Only the deterministic digest, never the raw token, is persisted or logged.

Sessions have a configurable server-side lifetime and capture the user's current
security version. Token-hash uniqueness and the user/revocation/expiry index
support deterministic lookup and lifecycle queries without password hashing or
table scans as a design dependency.

## Session validation

`PropriumSessionAuthenticationHandler` delegates every protected request to
`PostgresSessionService`. Missing and malformed credentials do not authenticate;
expired, revoked, disabled-user, security-version-mismatched, and unavailable
states fail closed. The service resolves token hashes and current user state from
PostgreSQL on every request. Redis cannot turn any rejection into a success.

The `SecurityVersion` snapshot makes security-affecting role and permission
changes invalidate existing sessions without rewriting those session rows.

## HTTP and cookie contract

The API surface is `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, and
`POST /api/v1/auth/logout`. Login and logout return `204` without response bodies;
invalid credentials return a generic `401`; request-policy failures use the
documented `400`, `403`, and `429` outcomes. Authentication responses are
`no-store`. Mutations require the canonical origin and CSRF checks.

Cookies are `HttpOnly`, `SameSite=Lax`, `Path=/`, and have a lifetime matching
the server setting. Production uses Secure `__Host-proprium_session`; local HTTP
development uses `proprium_session` without a Domain attribute. OpenAPI declares
the cookie through the `PropriumSession` security scheme and marks only protected
operations, such as current-user bootstrap, as requiring it.

## Authentication events

Authentication events are immutable PostgreSQL evidence. They record safe event
types and bounded metadata for accepted, rejected, revoked, malformed, and stale
session activity. Passwords, password hashes, raw tokens, token digests, secret
keys, and unbounded client input are excluded. A failed transactional rehash or
session creation cannot leave success evidence behind.

## Validation

Run the focused infrastructure-independent gate:

```text
npm run repo -- validate authentication-core
```

It checks 21 implementation and evidence artifacts and proves seven controlled
failures covering rehash outcomes, cryptographic randomness, raw-token
persistence, security-version rejection, Redis authority, CSRF policy, and
protected OpenAPI semantics. `validate backend` includes this gate.

Qualification also requires the Release build and analyzers, architecture and
classification suites, the PostgreSQL-backed integration suite, OpenAPI
generation, affected frontend authentication checks/build, and GP-25's live
browser authentication flow against a disposable real API stack. The canonical
results are recorded in the
[GP-26 validation record](../validation/week-3/gp-26-backend-authentication-core.md).
