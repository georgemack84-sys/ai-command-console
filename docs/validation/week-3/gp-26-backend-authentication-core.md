# GP-26 Backend Authentication Core Validation

## Scope

This record qualifies typed password verification, cryptographic opaque session
tokens, PostgreSQL session authority, request and cookie policy, authentication
events, protected OpenAPI semantics, and GP-25 compatibility.

## Automated evidence

| Evidence | Required result |
| --- | --- |
| Focused authentication-core policy | PASS: 21 artifacts |
| Controlled negative fixtures | PASS: 7 rejected fixtures |
| Repository command tests | PASS: 24 tests |
| Backend Release build/analyzers | PASS with zero warnings and errors |
| Backend unit suite | PASS: 64 tests |
| Backend architecture and classification | PASS: 20 architecture tests and 5 classification checks |
| PostgreSQL-backed integration suite | PASS: 59 tests |
| OpenAPI generation and validation | PASS |
| Affected frontend authentication validation and production build | PASS |
| Deterministic GP-25 browser authentication | PASS: 29 assertions |
| Live GP-25 browser authentication | PASS: 13 assertions against the real API, PostgreSQL, and Redis |
| Repository, documentation, formatting, and diff checks | PASS |

The isolated `proprium_gp26_auth` Compose project used dedicated PostgreSQL and
Redis host ports. Its containers, network, test-only database volume, temporary
administrator, and package caches were removed after qualification. No
production credential, raw session token, password, digest key, or persistent
test account is evidence.

## Security assertions

- Raw session tokens are not persisted, logged, or returned in JSON: **PASS**.
- Redis is not credential or session authority: **PASS**.
- Disabled, revoked, expired, malformed, and security-version-stale sessions
  cannot authenticate: **PASS**.
- Login rehash, session issuance, and success evidence are transactionally
  ordered: **PASS**.
- Protected OpenAPI operations declare the canonical cookie scheme: **PASS**.

## Compatibility and residual scope

The GP-25 browser contract remains unchanged: cookie credentials, `204` login
and logout, allow-listed current-user JSON, safe redirects, and no session-token
application state. Authorization policy, sliding renewal, retention-driven
physical cleanup, and authentication telemetry remain future work.
