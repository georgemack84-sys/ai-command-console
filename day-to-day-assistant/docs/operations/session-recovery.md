# Session Recovery

## Expired Session

The frontend redirects to sign in. The API returns `SESSION_EXPIRED` with a request ID.

## Revoked Session

The API returns `SESSION_REVOKED`, clears the cookie where practical, and requires sign-in.

## Password Change

Password changes revoke other sessions and rotate the current session token.

## Troubleshooting

Use `/api/v1/auth/sessions` while authenticated to inspect active sessions. Raw session tokens are never displayed.
