# Tool Registry

The tool registry catalogs application capabilities available to the planner. Phase 7 registers read-only tools for tasks, calendar events, reminders, notes, follow-ups, and Today summary retrieval.

Every tool has an identifier, name, description, input schema, output schema, and `read_only` flag. Phase 7 rejects hidden write behavior by design: no write-capable tools are registered for planning.
