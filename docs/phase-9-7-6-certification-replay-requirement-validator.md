# Mission Control Phase 9.7.6 - Certification & Replay Requirement Validator

## Preview

Phase 9.7.6 validates that every governance decision has mandatory certification prerequisites and complete deterministic replay before final enforcement may continue. It verifies certification status, replay availability, replay completeness, deterministic reconstruction, certification lineage, evidence packages, replay reports, ledger records, and replay support.

## Tightened Contract

- Certification readiness is mandatory before enforcement.
- Replay packages must include decision, governance, constitutional, authority, tenant, evidence, lineage, timestamp, hash, and enforcement outcome artifacts.
- Missing, partial, revoked, expired, invalid-version, scope-mismatched, unresolved, or divergent artifacts block progression.
- Certification lineage must be complete and traceable.
- This phase does not re-evaluate governance, constitutional, authority, tenant isolation, or final integrity hashing from Phase 9.7.7.

## Implementation

- Types: `types/certification-replay-requirement-validator.ts`
- Service: `services/certification-replay-requirement-validator/index.ts`
- Tests: `tests/unit/certification-replay-requirement-validator/certificationReplayRequirementValidator.test.ts`

## Certification Evidence

The service publishes `getCertificationReplayValidatorFoundation()`, plus requirement creation, replay artifact creation, validation, replay, and observability APIs. Each validation emits a Certification Evidence Package, Replay Integrity Report, and immutable Certification & Replay Ledger record.
