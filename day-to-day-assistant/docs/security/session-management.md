# Session Management

## Model

Sessions store only a hash of the session token. The raw token is generated with a cryptographically secure random generator and sent to the browser in an HttpOnly cookie.

## Defaults

- Standard session: 12 hours
- Remembered session: 7 days
- Cookie: HttpOnly, SameSite=Lax, Path=/
- Production hardening: Secure cookie flag must be enabled before non-local deployment

## Revocation

Logout revokes the current server-side session. The user can revoke other sessions and revoke all other sessions. Password change revokes other sessions and rotates the current token.
