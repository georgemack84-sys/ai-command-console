# Mission Control Phase 9.1.9 - Validation Engine

## Preview

Phase 9.1.9 establishes the Decision Orchestration Validation Engine as the mandatory deterministic gate before orchestration. It composes the Phase 9.1.1 through 9.1.8 contract, schema, lifecycle, governance, constitutional, authority, replay, lineage, and integrity checks into one immutable validation report.

## Tightened Scope

- Validation is advisory-only and fail-closed.
- Domains execute in deterministic order: schema, lifecycle, governance, constitution, authority, replay, lineage, integrity.
- The engine does not mutate or correct contracts.
- Failures are normalized into stable error classes and deterministic ordering.
- Every report includes rule IDs, domain evidence, replay references, lineage references, metadata, an evidence package, and a reproducible SHA-256 integrity hash.
- Replay recomputes the report hash and validation sequence to prove fidelity.
- `CONDITIONAL_PASS` is limited to approved non-functional warnings and never weakens governance, constitutional, authority, replay, lineage, or integrity enforcement.

## Implementation

- `types/decision-validation-engine.ts` defines validation domains, states, error classes, severity levels, rule records, domain results, reports, metadata, evidence packages, replay results, scenarios, and observability.
- `services/decision-validation-engine/index.ts` implements the validation rule registry, domain validation, error classification, report generation, complete contract validation, replay validation, and observability aggregation.
- `tests/unit/decision-validation-engine/decisionValidationEngine.test.ts` verifies baseline pass behavior, registry coverage, conditional pass behavior, fail-closed boundary cases, domain validation, deterministic reports, error classification, and observability.

## Public API

- `validateDecisionContract`
- `validateDomain`
- `classifyValidationError`
- `generateValidationReport`
- `replayValidation`
- `getValidationRules`
- `buildDecisionValidationObservability`
- `getDecisionValidationEngine`
