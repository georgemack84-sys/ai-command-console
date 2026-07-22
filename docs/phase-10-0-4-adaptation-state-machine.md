# Phase 10.0.4 - Adaptation State Machine

## Preview

Phase 10.0.4 establishes the deterministic lifecycle controller for adaptive proposals. A learning permission may authorize a capability, but every adaptive proposal must still move through explicit, replayable, governed states before becoming available.

## Tightened Contract

The implementation exposes:

- `AdaptationStateRecord` for adaptation/proposal identity, current and previous state, review and certification status, replay reference, rollback availability, and integrity.
- `AdaptationTransitionRequest` and `AdaptationTransitionResult` for matrix-validated lifecycle transitions.
- `AdaptationStateReplayModel` for deterministic replay of state changes.
- `AdaptationStateCertificationReport` for transition order, governance, operator, certification, rollback, replay, ledger, observability, and advisory-only certification.
- `AdaptationStateLedgerRecord` and `AdaptationStateValidation` for immutable lifecycle history and fail-closed validation.

## Fail-Closed Validation

The state machine blocks on invalid learning permission, hidden states, skipped or reversed transitions, duplicate approval, certification before approval, operator review before governance, availability before certification, replay omission, governance/operator/certification bypass, unauthorized approval or rollback, invalid rollback target, simulation or validation failure, state forgery, lifecycle tampering, integrity mismatch, fail-open behavior, authorization failure, or execution authority.

## Implementation

- Types: `types/adaptation-state-machine.ts`
- Service: `services/adaptation-state-machine/index.ts`
- Tests: `tests/unit/adaptation-state-machine/adaptationStateMachine.test.ts`

Primary API:

- `runAdaptationStateMachine(input?)`
- `replayAdaptationStateMachine(result)`
- `computeAdaptationStateHash(record)`
- `getAdaptationStateMachineFoundation()`
- `AdaptationStateMachine.run(...)`
- `AdaptationStateMachine.replay(...)`
