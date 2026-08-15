# Phase 1 Week 3: Authentication and Authorization Foundation

Week 3 begins on the GP-24-qualified UI foundation. Its frontend work inherits
the conditional human accessibility attestation without weakening any automated
Week 2 gate.

## GP-25: Authentication UI foundation

GP-25 establishes the dedicated login route, canonical unknown/authenticated/
unauthenticated session model, authoritative current-user bootstrap, safe return
paths and authentication errors, logout transition, and a protected AppShell that
cannot flash before session resolution. See the
[implementation specification](../engineering/gp-25-authentication-ui.md) and
[validation record](../validation/week-3/gp-25-authentication-ui.md).

GP-26 may evolve backend authentication internals only through their existing
contract and security validation. It must not create a second frontend session
authority or expose the opaque session token to browser application state.

## GP-26: Backend authentication core

GP-26 freezes the backend credential and opaque-session contract. ASP.NET Core
Identity verifies passwords through typed outcomes, PostgreSQL remains the sole
session authority, and only a keyed digest of each random session token is
persisted. Login, current-user bootstrap, logout, cookie policy, audit evidence,
and protected OpenAPI operations are qualified by repository-owned positive and
controlled-failure gates. See the
[implementation specification](../engineering/gp-26-backend-authentication-core.md)
and [validation record](../validation/week-3/gp-26-backend-authentication-core.md).

GP-27 may build authorization policy on this identity foundation. It must not
make role names an authorization API, permit Redis to authenticate requests, or
weaken the security-version invalidation boundary.
