# Mission Control Phase 9.1.4 - Decision Lifecycle Model

## Purpose

Phase 9.1.4 establishes the deterministic lifecycle state machine for every orchestrated Mission Control decision. It defines lifecycle states, allowed transitions, terminal states, failure states, transition metadata, validation rules, replay behavior, integrity hashing, and lifecycle observability.

The lifecycle model governs state progression only. It does not determine outcomes, approve recommendations, execute actions, mutate governance, or alter constitutional rules.

## Canonical Implementation

- `types/decision-lifecycle.ts`
- `services/decision-lifecycle/index.ts`
- `tests/unit/decision-lifecycle/decisionLifecycle.test.ts`

## State Machine

The canonical forward path is:

`CREATED -> VALIDATING -> INPUT_ACCEPTED -> EVIDENCE_READY -> GOVERNANCE_REVIEW -> CONSTITUTION_REVIEW -> AUTHORITY_VALIDATION -> READY_FOR_ORCHESTRATION -> ORCHESTRATED -> OPERATOR_VISIBLE -> PENDING_DECISION`

From `PENDING_DECISION`, the lifecycle may move to:

- `APPROVED -> COMPLETED -> ARCHIVED`
- `REJECTED -> ARCHIVED`
- `DEFERRED -> AWAITING_INPUT -> VALIDATING`

No other transitions are allowed.

## Failure States

Validation failures enter explicit fail-closed states:

- `VALIDATION_FAILED`
- `GOVERNANCE_FAILED`
- `CONSTITUTION_FAILED`
- `AUTHORITY_FAILED`
- `REPLAY_FAILED`
- `INTEGRITY_FAILED`
- `TENANT_ISOLATION_FAILED`
- `SERIALIZATION_FAILED`
- `UNKNOWN_STATE`

Failure states preserve evidence, block progression, remain advisory-only, and appear in lifecycle observability.

## APIs

- `createDecisionLifecycle()`
- `transitionDecisionState()`
- `validateLifecycleState()`
- `validateStateTransition()`
- `replayDecisionLifecycle()`
- `buildDecisionLifecycleObservability()`
- `getDecisionLifecycleModel()`

## Guarantees

Every transition records a `DecisionLifecycleRecord` with previous state, current state, transition reason, normalized timestamp, actor, governance status, constitutional status, authority status, replay reference, tenant and mission ownership, append-only marker, advisory-only marker, execution denial, and SHA-256 integrity hash.

Replay reconstructs the same ordered state sequence and repository hash. Invalid transitions, terminal reactivation, archived reactivation, governance bypass, constitutional bypass, authority escalation, missing replay references, tenant mutation, advisory-only violations, and integrity mismatches fail closed.

## Exit Criteria

Phase 9.1.4 is complete when the canonical state machine is implemented, deterministic transition rules are enforced, lifecycle metadata is recorded append-only, terminal and failure states are operational, replay reconstructs identical histories, tenant isolation and advisory-only behavior are preserved, and focused tests cover valid progression plus fail-closed boundary cases.
