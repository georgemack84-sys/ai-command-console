# Mission Control Phase 9.2.3 - Schema Validation

## Preview

Phase 9.2.3 validates raw decision candidate structure before normalization, registry entry, duplicate detection, or orchestration. It rejects malformed, incomplete, reference-broken, lineage-broken, or nondeterministic candidates with immutable evidence and deterministic replay.

## Tightened Scope

- This phase validates candidate schema only; it does not normalize, score, deduplicate, prioritize, or orchestrate.
- Checks execute in fixed order: object structure, required fields, identifiers, references, lineage completeness, canonical serialization.
- Rejected candidates are never allowed downstream.
- Intake integration is exposed through `schemaValidationRequestFromIntake` and `validateSchemaForIntake`.
- Replay reconstructs the validation result hash and state.

## Implementation

- `types/decision-candidate-schema-validation.ts` defines validation states, failure reasons, validation requests/results, required-field records, reference records, lineage records, audit records, replay, intake bridge output, and observability.
- `services/decision-candidate-schema-validation/index.ts` implements deterministic candidate schema validation, fixed-order audit evidence, canonical serialization checks, intake adaptation, replay, and metrics.
- `tests/unit/decision-candidate-schema-validation/decisionCandidateSchemaValidation.test.ts` verifies valid candidates, required field failures, malformed structures, identifiers, references, lineage, serialization, intake integration, replay, and observability.

## Public API

- `createSchemaValidationRequest`
- `validateDecisionCandidateSchema`
- `schemaValidationRequestFromIntake`
- `validateSchemaForIntake`
- `replaySchemaValidation`
- `buildCandidateSchemaObservability`
- `getDecisionCandidateSchemaValidationEngine`
