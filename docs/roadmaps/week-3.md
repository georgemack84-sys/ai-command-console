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
