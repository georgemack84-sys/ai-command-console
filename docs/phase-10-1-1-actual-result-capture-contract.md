# Phase 10.1.1 - Actual Result Capture Contract

## Preview

Phase 10.1.1 establishes the canonical contract for capturing actual outcomes after Mission Control decisions. It defines deterministic outcome identity, schema versioning, timestamps, references, evidence requirements, mission impact, governance and operator results, replay metadata, and integrity verification.

## Tightened Contract

The implementation exposes:

- `OutcomeObservationRecord` for canonical outcome observations.
- `MissionImpact`, `RiskActualization`, and `ConfidenceActualization` for structured observed facts.
- `OutcomeContractVersion` for replay-compatible schema evolution.
- Schema, identity, evidence, replay, and aggregate capture validation records.
- Immutable observation ledger records and a capture certification report.

## Fail-Closed Validation

Validation blocks on uncertified architecture, missing required fields, duplicate outcome IDs, unsupported schemas, invalid timestamps, missing or invalid evidence, missing replay or governance references, nondeterministic serialization, integrity mismatch, orphan outcomes, broken historical replay, inferred or predictive outcomes, recommendations, identity or timestamp mutation, validation after persistence, authorization failure, or fail-open behavior.

Missing evidence deterministically maps the record to `INSUFFICIENT_EVIDENCE`.

## Implementation

- Types: `types/actual-result-capture-contract.ts`
- Service: `services/actual-result-capture-contract/index.ts`
- Tests: `tests/unit/actual-result-capture-contract/actualResultCaptureContract.test.ts`

Primary API:

- `runActualResultCaptureContract(input?)`
- `replayActualResultCaptureContract(result)`
- `computeOutcomeObservationHash(record)`
- `getActualResultCaptureContractFoundation()`
- `ActualResultCaptureContract.run(...)`
- `ActualResultCaptureContract.replay(...)`
