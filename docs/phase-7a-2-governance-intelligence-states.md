# Phase 7A.2 Governance Intelligence States

## Purpose

Phase 7A.2 defines the deterministic state machine for Governance Intelligence records created by Phase 7A.1.

Every state transition is explicit, validated, tenant-scoped, evidence-bound, lineage-preserving, replayable, observable, ledger-recorded, and fail-closed.

## Canonical States

- `CREATED`
- `ANALYZING`
- `CORRELATED`
- `RECOMMENDING`
- `ESCALATED`
- `CERTIFIED`
- `ARCHIVED`

Unknown states are rejected. Hidden states, state aliases, runtime-only states, skipped lifecycle states, and regressive transitions fail closed.

## Allowed Transitions

The state machine allows only these transitions:

- `CREATED -> ANALYZING`
- `ANALYZING -> CORRELATED`
- `CORRELATED -> RECOMMENDING`
- `RECOMMENDING -> ESCALATED`
- `RECOMMENDING -> CERTIFIED`
- `ESCALATED -> CERTIFIED`
- `CERTIFIED -> ARCHIVED`

All other transitions are blocked and still produce ledger-recorded transition attempts.

## Transition Events

Every transition attempt produces a deterministic event containing:

- identity, tenant, and mission binding
- from and to states
- transition timestamp, reason, actor, and source
- evidence, policy, lineage, replay, recommendation, and escalation references
- previous state hash
- new state hash
- transition hash
- validation result
- failure reason when blocked
- ledger-recorded marker

Failed transitions are retained because they are governance evidence.

## Validation

The transition validator blocks:

- unknown or invalid states
- missing current or target states
- disallowed transitions
- state skips
- state regressions
- archived record reactivation
- certified record mutation except archival
- tenant or mission mismatch
- missing governance or policy scope
- missing operator supremacy
- execution authority
- missing evidence, policy, lineage, or replay references
- missing escalation references or reason
- invalid certification status before certification or archival
- state or transition hash mismatch during replay

## Hashing

State hashes are computed from a stable serialization of:

- identity
- tenant and mission binding
- current state
- evidence, policy, lineage, replay, recommendation, and escalation references
- certification status
- previous state hash

Transition hashes are computed from the full transition event body, excluding the generated event id and transition hash itself. This makes transitions reproducible and replay-verifiable.

## Replay

State replay starts from the initial Governance Intelligence record and applies transition events in order.

Replay verifies:

- event `from_state` matches the reconstructed current state
- previous state hash matches
- transition hash is reproducible
- new state hash is reproducible
- final state and state path are deterministic

Missing events, path mismatches, hash mismatches, and tampered transition events fail closed.

## Observability

The state surface exposes:

- current state
- previous state
- next allowed states
- blocked transitions
- transition history
- evidence, policy, lineage, replay, recommendation, and escalation references
- certification status
- latest failure reason

This gives operators and later certification phases a stable inspection contract without inventing hidden lifecycle behavior.

## Deliverables

- State doctrine and transition matrix in `services/governance-intelligence/index.ts`
- State and transition types in `types/governance-intelligence.ts`
- State surface, transition, and replay API routes under `app/api/governance-intelligence`
- Deterministic state and transition hashing
- Replay-compatible state reconstruction
- Operator observability surface
- Focused state machine test suite in `tests/unit/governance-intelligence/governanceIntelligenceStates.test.ts`

## Exit Criteria

7A.2 is complete when all canonical states are defined, allowed transitions are enforced, blocked transitions fail closed, state hashes and transition hashes are reproducible, replay reconstructs the same state path, archived records cannot reactivate, transition attempts are ledger-recorded, and operators can inspect the state history.
