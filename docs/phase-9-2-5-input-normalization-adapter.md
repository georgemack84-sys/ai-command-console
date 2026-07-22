# Mission Control Phase 9.2.5 - Input Normalization Adapter

## Preview

Phase 9.2.5 converts trusted subsystem decision payloads into the canonical `DecisionCandidate` contract. It removes subsystem-specific formatting while preserving source lineage, evidence, governance, replay, authority metadata, advisory-only constraints, registry evidence, duplicate decisions, and intake ledger records.

## Tightened Scope

- This phase normalizes only candidates that have already passed source, schema, and integrity gates.
- It does not validate identity, verify integrity, prioritize decisions, approve recommendations, or execute orchestration.
- Normalization is deterministic: the same input and rules produce the same candidate, hash, registry record, ledger record, and replay result.
- Duplicate candidates are linked and preserved in lineage while duplicate orchestration is blocked.
- Failed normalization is fail-closed and does not write a candidate registry record.

## Implementation

- `types/decision-input-normalization.ts` defines the canonical `DecisionCandidate`, registry records, intake ledger records, duplicate records, normalization rules, audit records, replay, intake bridge, and metrics.
- `services/decision-input-normalization/index.ts` implements deterministic terminology, identifier, reference, evidence, governance, replay, authority, and advisory metadata normalization plus registry, duplicate detection, ledger, replay, and metrics.
- `tests/unit/decision-input-normalization/decisionInputNormalization.test.ts` verifies canonical output, deterministic replay, fail-closed rejection, duplicate handling, intake integration, and observability metrics.

## Public API

- `createInputNormalizationRequest`
- `normalizeDecisionCandidateInput`
- `inputNormalizationRequestFromIntake`
- `normalizeInputForIntake`
- `replayInputNormalization`
- `buildDecisionIntakeMetrics`
- `getDecisionInputNormalizationAdapter`
