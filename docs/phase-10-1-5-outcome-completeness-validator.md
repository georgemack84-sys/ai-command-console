# Mission Control Phase 10.1.5 - Outcome Completeness Validator

## Preview

Phase 10.1.5 adds the deterministic completeness gate for outcome observations. It verifies that every observation has the mandatory structural metadata, decision lineage, evidence, operator lineage, governance lineage, mission linkage, replay metadata, and integrity metadata required before it can enter the Outcome Observation Ledger.

## Tightened Contract

The validator checks completeness only, not whether the observed outcome was correct, successful, or desirable. It never repairs missing data, infers references, mutates observations, or lets completeness scores override mandatory failures. Missing evidence maps to `INSUFFICIENT_EVIDENCE`; missing replay, operator, governance, mission, schema, identity, or integrity metadata blocks certification.

## Fail-Closed Validation

Certification fails for incomplete observations, missing evidence without the insufficient-evidence state, missing replay refs, missing operator refs, missing governance refs, missing mission linkage, orphan observations, nondeterministic validation, bypassed completeness rules, replay mismatch, omitted integrity verification, tenant isolation violations, inferred references, observation mutation, invalid evidence registry input, authorization failure, or constitutional governance bypass.

## Implementation

Implemented artifacts:

- `types/outcome-completeness-validator.ts`
- `services/outcome-completeness-validator/index.ts`
- `tests/unit/outcome-completeness-validator/outcomeCompletenessValidator.test.ts`

The service composes `runOutcomeEvidenceRegistry()`, detects missing mandatory data, applies deterministic validation rules, produces quality and replay reports, keeps metrics advisory-only, and exposes replay/hash helpers plus the phase foundation accessor.
