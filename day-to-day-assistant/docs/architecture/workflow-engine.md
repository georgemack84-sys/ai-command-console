# Workflow Engine

Workflows are ordered step lists attached to automations.

Supported step types are `READ`, `SEARCH`, `PLAN`, `CREATE`, `UPDATE`, `DELETE`, `WAIT`, `CONDITION`, and `NOTIFY`. Read, search, plan, wait, condition, and notify steps do not mutate domain state. Create, update, and delete steps require an allowed `tool_name` in the automation write scope and execute through the Action Gateway.

Each automation execution records step execution rows, results, action proposal IDs, action execution IDs, attempts, errors, and completion timestamps. Duplicate triggers reuse the execution with the same deterministic idempotency key.
