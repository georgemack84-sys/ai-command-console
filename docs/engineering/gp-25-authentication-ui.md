# GP-25: Authentication UI foundation

## Decision

GP-25 hardens the repository's admitted authentication prototype rather than
creating another state or transport system. `AuthenticationProvider` remains the
single session authority, the canonical API client remains the only transport,
and the GP-21 shell mounts only after `/api/v1/auth/me` succeeds.

## Architecture

- Login route: `/login`, outside AppShell.
- Protected layout: `src/app/(protected)/layout.tsx`.
- Session owner: `src/lib/auth/auth-provider.tsx`.
- Current-user authority: `GET /api/v1/auth/me`.
- API module: `src/lib/auth/auth-service.ts` over the canonical API client.
- Shell gate: `ProtectedExperienceBoundary`.
- Login gate: `LoginExperienceBoundary`.
- Logout integration: `UserMenu` calls the backend, clears provider state, and
  replaces history with `/login`.

The server-side proxy is an early admission optimization only. It never treats a
cookie as proof of authentication.

## Foundation classification

`FOUNDATION_COMPATIBLE`. The change consumes and mechanically extends GP-19
through GP-24 contracts without changing App Router ownership, CI topology,
environment variables, the backend contract, or the design system.

## Integration qualification

The fast browser gate exercises the complete frontend transition with
deterministic API responses. The separate `test:browser:live-auth` command must
use disposable development credentials and a real API, PostgreSQL, and Redis. It
contains no route interception and verifies login, cookie issuance, `/me`,
refresh, logout, persisted revocation, revoked-cookie rejection, safe returns,
and no protected-content flash.

The live run exposed a contract mismatch that deterministic transport could not:
the backend uses `proprium_session` outside production, while the frontend proxy
previously admitted only `__Host-proprium_session`. Proxy admission now selects
the same environment-specific name as the backend. Production retains the
`__Host-` cookie; all non-production environments use the local HTTP-compatible
name. In both cases `/me`, not cookie presence, remains authoritative.
