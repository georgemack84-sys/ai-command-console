# Action Gateway

The action gateway is the single server-side entry point for assistant-initiated writes.

The gateway validates authentication, proposal status, expiration, explicit confirmation, one-time action tokens, write tool registration, idempotency keys, execution routing, verification, audit history, and rollback metadata. The model never calls domain repositories or writes to the database directly.

Initial gateway tools cover task create/update/complete, reminder create/update/cancel, calendar event create/update/cancel, note create/update, and follow-up create/update. Each tool delegates to the existing application service that already owns validation and persistence.
