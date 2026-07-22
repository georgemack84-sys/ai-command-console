# Phase 9.9.3 - Operator Action Engine

## Preview

The Operator Action Engine is the authoritative boundary for operator-initiated workflow actions in Phase 9.9. It validates the requested action, operator authority, workflow state, governance and constitutional status, tenant and mission ownership, replay references, lineage, advisory-only behavior, and integrity before recording an outcome.

## Tightened Contract

- Supported actions are explicit and uppercase: `APPROVE`, `REJECT`, `DEFER`, `REQUEST_MORE_EVIDENCE`, `REQUEST_SIMULATION`, `REQUEST_GOVERNANCE_REVIEW`, `REQUEST_RECOVERY_PLAN`, `OVERRIDE_RECOMMENDATION`, `ESCALATE`, and `ARCHIVE`.
- Action execution is represented as a deterministic, replayable outcome event and ledger record. This service does not perform external side effects or autonomous execution.
- Workflow mutations are only accepted from legal action/state combinations and are represented by the resulting workflow state in the action result.
- Invalid, unauthorized, cross-tenant, governance-invalid, constitutional-invalid, replay-incomplete, lineage-incomplete, tampered, or archived actions fail closed.
- Records are append-only and integrity-hashed for replay fidelity.

## Implementation

- Types: `types/operator-action-engine.ts`
- Service: `services/operator-action-engine/index.ts`
- Tests: `tests/unit/operator-action-engine/operatorActionEngine.test.ts`

The service integrates with the Phase 9.9.2 Workflow State Machine and defaults to processing an advisory `APPROVE` action from `PRESENTED` to `APPROVED`.
