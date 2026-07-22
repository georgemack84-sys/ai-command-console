# Planning Engine

The Phase 7 planning engine follows a deterministic request lifecycle: understand, retrieve context, plan, and explain. It persists request logs, context packages, execution plans, and planning metrics.

Plans are read-only execution previews. They select application tools, describe steps, cite retrieved records, and explain assumptions without modifying application state.

The engine intentionally uses deterministic local rules in Phase 7 so tests and offline development do not depend on hosted AI behavior.
