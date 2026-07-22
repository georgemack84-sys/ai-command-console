# Automation Engine

Phase D2D.10 adds bounded autonomous operation through explicit automations.

Automations belong to one user, have an authority level, read and write scopes, lifecycle status, trigger, workflow, catch-up policy, retry limit, next run, and execution history. Automations never run when paused, disabled, archived, expired, or outside their declared scope.

User-created automations and approved templates are treated as explicit authorization for the workflow definition. State-changing workflow steps still route through the Phase 8 Action Gateway, which creates proposals, approval records, tokens, executions, verification, audit entries, and idempotency protection.
