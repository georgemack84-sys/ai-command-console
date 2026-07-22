# Identity Module

## Responsibilities

- First-run local account setup
- Password validation, hashing, and verification
- Login rate state and temporary lockout
- Session creation, validation, listing, revocation, and rotation
- Password change
- Protected API context
- Authentication audit events

## Boundaries

The AI layer has no role in authentication. Frontend route checks are convenience only; backend session validation is authoritative.

## Storage

Identity state is stored in `users`, `user_settings`, `sessions`, `login_attempts`, and `audit_events_v2`.
