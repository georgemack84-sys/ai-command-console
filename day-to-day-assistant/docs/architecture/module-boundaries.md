# Module Boundaries

Modules communicate through declared service interfaces or contracts. Database tables are owned by one module. Shared utilities must remain domain-neutral.

AI provider code belongs in the AI Gateway. External provider code belongs in integration adapters. State-changing assistant actions belong behind the Action Gateway. The frontend must never access the database directly.

## Initial Modules

- Identity and local authentication
- Tasks
- Reminders
- Local calendar
- Follow-ups
- Notes
- Conversations
- Memory controls
- Action proposals and confirmations
- Activity and audit
- AI gateway
- Integration adapters
- Backup and restore
- Settings
