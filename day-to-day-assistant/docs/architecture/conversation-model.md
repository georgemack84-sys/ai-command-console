# Conversation Model

Conversations are user-owned records with `ACTIVE` or `ARCHIVED` state. Messages are append-only and ordered by creation time. Supported roles are `SYSTEM`, `USER`, `ASSISTANT`, and `TOOL`.

Assistant messages record provider, model, prompt version, token usage, and structured payload metadata. Archived conversations remain searchable when requested and can be restored.

Deletion requests archive conversations in Phase 6 to preserve auditability and recovery.
