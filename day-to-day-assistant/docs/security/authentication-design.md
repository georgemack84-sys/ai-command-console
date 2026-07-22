# Authentication Design

Phase D2D.2 implements local single-user authentication owned by the Day-to-Day Assistant. No external identity provider is required.

## Flow

1. First-run setup creates the only active local account.
2. Passwords are validated server-side and stored only as salted hashes.
3. Login verifies the password outside the AI layer.
4. Successful login creates a server-side session and an HttpOnly cookie.
5. Protected APIs validate the session token hash on every request.
6. Logout and revocation update server-side session state.

## Fail-Closed Rules

Missing, expired, revoked, unknown, disabled, or uncertain sessions are rejected. The frontend may redirect, but backend route protection is authoritative.

## Information Disclosure

Login failures use a generic message and do not disclose whether an account exists.
