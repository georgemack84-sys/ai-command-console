# Authentication UI foundation

GP-25 establishes one frontend authentication authority, one login route, and
one fail-closed protected-shell boundary. It consumes the Week 2 UI system and
the existing backend contract; it does not make the browser an authorization
authority.

## Backend contract

The inspected API contract is authoritative:

| Operation    | Endpoint                   | Request                     | Success                                          | Safe failures                                                                                                         |
| ------------ | -------------------------- | --------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Login        | `POST /api/v1/auth/login`  | JSON `username`, `password` | `204`; opaque session cookie issued              | `400` malformed request, `401` credential rejection, `403` origin/CSRF rejection, `429` rate limit with `Retry-After` |
| Current user | `GET /api/v1/auth/me`      | Browser cookie              | `200` approved identity, roles, and permissions  | `401` missing/invalid session, `403` authenticated identity lacks profile-read permission                             |
| Logout       | `POST /api/v1/auth/logout` | Browser cookie              | `204`; server session revoked and cookie cleared | `403` origin/CSRF rejection                                                                                           |

The canonical API client sends `credentials: "include"`. State-changing requests
carry `X-Proprium-CSRF: 1`; the backend also requires the configured exact
`Origin`. Authentication responses are `no-store`.

The cookie is `HttpOnly`, `SameSite=Lax`, path `/`, and explicitly expires. It is
`Secure` and named `__Host-proprium_session` in production; development uses the
non-secure `proprium_session` name. Frontend code never reads or copies its value.

## Session state model

The single `AuthenticationProvider` owns these states:

- `unknown`: the authoritative `/me` request has not resolved; no login form or
  protected presentation is trusted yet.
- `authenticated`: `/me` returned an approved current user.
- `unauthenticated`: `/me` returned `401`, logout completed, or a later API `401`
  invalidated the resolved session.
- `unauthorized`: the session exists but the current-user permission contract
  returned `403`.
- `error`: session resolution failed for a network, contract, or service reason.

Transitions are explicit: startup/refresh enters `unknown`; `/me` produces an
authenticated, unauthenticated, unauthorized, or error state; login re-runs
`/me`; confirmed logout and post-authentication `401` clear the user and enter
`unauthenticated`. Concurrent stale requests cannot restore invalidated access.

The provider is mounted at the public-login and protected route groups rather
than the root layout. Authentication-independent routes such as `/health` do not
download authentication client code or issue an unnecessary `/me` request. The
theme provider remains global because every route consumes the theme contract.

## No-flash invariant

> Protected UI SHALL not render while authentication status is UNKNOWN.

The Next.js proxy rejects a missing or structurally excessive cookie before a
protected page response, but cookie presence is admission only. An admitted
opaque value is still resolved by `/me`. The protected experience renders a
neutral session-resolution frame until that check succeeds. AppShell and route
children mount only in the authenticated state.

The login route uses the inverse boundary: it renders the form only after an
authoritative unauthenticated result. A resolved authenticated user is redirected
with App Router APIs to a validated internal return path or `/dashboard`.

## Security boundaries

- Passwords exist only in the mounted form and request body. They are not stored,
  logged, placed in URLs, or copied into the authentication provider.
- Raw session tokens and cookies never enter React state, browser storage, logs,
  or manually constructed authorization headers.
- Return paths must be application-relative, bounded, decoded safely, and cannot
  target login/auth routes, absolute URLs, protocol-relative URLs, or backslashes.
- `401` login failures use one generic credential message. `429` has safe retry
  guidance. Other failures use a generic service message; raw backend content is
  never rendered.
- Authentication identifies the user. Backend authorization remains mandatory;
  frontend presentation does not grant access to protected API data.

## Login experience

The dedicated `/login` route uses GP-20 `Field`, `Input`, `FieldError`, `Button`,
and `IconButton`. It has native form submission, username/current-password
autocomplete, duplicate-submit prevention, accessible busy/error announcements,
and no dead registration, reset, remember-me, MFA, or SSO controls.

## Validation

Run `npm run repo -- validate authentication-ui` for the focused contract and
nine controlled failures. The canonical frontend gate includes it. Unit tests
cover login semantics, error safety, state transitions, redirects, and shell
gating. Storybook covers default, invalid, submitting, rate-limited, service-error,
and bootstrap states without a backend. Browser certification covers no-cookie
and invalid-cookie direct access, mocked valid/invalid/rate-limited login,
refresh/logout behavior, browser Back, 320px through desktop, 200% text scaling,
password reveal, and Axe.

The infrastructure-independent browser suite remains the fast deterministic
gate. To qualify the real boundary, start a disposable development API with
PostgreSQL and Redis, configure its allowed origin as
`http://127.0.0.1:3100`, and run:

```powershell
$env:PROPRIUM_LIVE_AUTH_USERNAME = '<disposable-development-user>'
$env:PROPRIUM_LIVE_AUTH_PASSWORD = '<disposable-development-password>'
$env:PROPRIUM_LIVE_API_BASE_URL = 'http://127.0.0.1:8080'
npm run test:browser:live-auth
```

This command fails closed when credentials are absent and never logs them. It
does not intercept browser requests. It proves real `401` and `204` login
outcomes, the environment-specific HttpOnly cookie, `/me` refresh continuity,
logout cookie clearing, PostgreSQL revocation, revoked-cookie replay rejection,
safe returns, browser-storage absence, and the no-flash invariant.
