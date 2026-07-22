# Phase 10.1.2 - Decision Outcome Intake Adapter

## Preview

Phase 10.1.2 establishes the deterministic intake boundary for decision outcome data. It receives payloads from operator workflow, execution, governance, rollback, mission system, and simulation sources, then normalizes them into the canonical Actual Result Capture Contract without analysis, learning, scoring, or inference.

## Tightened Contract

The implementation exposes:

- `OutcomeIntakeRecord` for the canonical intermediate intake object.
- `OutcomeSourceRegistry` and registry entries for approved source governance.
- `OutcomeSourceNormalization` and `OutcomeMappingResult` for deterministic normalization and mapping into `OutcomeObservationRecord`.
- `OutcomeDuplicateDetection`, `OutcomePayloadRouting`, `OutcomeIntakeAuditLogRecord`, `OutcomeIntakeMetrics`, validation, and certification report records.

## Fail-Closed Validation

Validation blocks unsupported, invalid, malformed, unauthorized, conflicting, nondeterministic, evidence-altered, governance-lost, replay-removed, timestamp-mutated, tenant-crossing, integrity-bypassed, missing-field, invalid-identifier, unsupported-schema, missing-evidence, missing-replay, missing-governance, replay-failed, analysis-attempted, or fail-open payloads.

Identical duplicates are deterministically routed to the duplicate ledger instead of creating a second observation.

## Implementation

- Types: `types/decision-outcome-intake-adapter.ts`
- Service: `services/decision-outcome-intake-adapter/index.ts`
- Tests: `tests/unit/decision-outcome-intake-adapter/decisionOutcomeIntakeAdapter.test.ts`

Primary API:

- `runDecisionOutcomeIntakeAdapter(input?)`
- `replayDecisionOutcomeIntakeAdapter(result)`
- `computeOutcomeIntakeHash(record)`
- `getDecisionOutcomeIntakeAdapterFoundation()`
- `DecisionOutcomeIntakeAdapter.run(...)`
- `DecisionOutcomeIntakeAdapter.replay(...)`
