# Security Review

Phase D2D.12 validates the local security baseline:

- account setup locks after the first active user;
- passwords use PBKDF2-SHA256;
- sessions use opaque hashed tokens;
- action execution requires explicit confirmation by default;
- connector secrets are stored separately and excluded from API responses;
- diagnostics exclude session and connector authorization tables;
- audit events record sensitive operations with metadata redaction.

Residual production item: encrypted backup export requires a user-controlled credential before sharing backup files outside the local machine.
