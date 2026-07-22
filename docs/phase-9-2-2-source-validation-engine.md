# Mission Control Phase 9.2.2 - Source Validation Engine

## Preview

Phase 9.2.2 implements the authoritative trust boundary for Decision Orchestration intake. It verifies subsystem identity, registration, signatures, certification status, version compatibility, tenant isolation, mission ownership, authority scope, and replay compatibility before any candidate proceeds downstream.

## Tightened Scope

- This phase validates the submitting source only; it does not normalize, score, deduplicate, prioritize, or orchestrate decisions.
- The engine reuses the certified source registry introduced by Phase 9.2.1 and exposes an adapter from `DecisionIntakeRequest`.
- Source validation fails closed for unknown sources, missing registration, bad signatures, expired or revoked certification, version mismatch, tenant/mission violations, authority violations, and replay incompatibility.
- Every validation result includes immutable audit records, replay references, and a deterministic integrity hash.

## Implementation

- `types/decision-source-validation.ts` defines validation states, failures, requests, registered subsystem records, certification records, audit records, results, replay results, intake bridge output, and observability.
- `services/decision-source-validation/index.ts` implements identity resolution, registration validation, signature verification, certification validation, version checks, tenant checks, mission ownership, authority scope checks, replay compatibility, intake bridging, deterministic replay, and metrics.
- `tests/unit/decision-source-validation/decisionSourceValidation.test.ts` verifies PASS behavior, all fail-closed boundary cases, intake integration, deterministic replay, and observability.

## Public API

- `createSourceValidationRequest`
- `signSourceValidationRequest`
- `resolveSubsystemIdentity`
- `validateDecisionSource`
- `sourceValidationRequestFromIntake`
- `validateSourceForIntake`
- `replaySourceValidation`
- `buildSourceValidationObservability`
- `getDecisionSourceValidationEngine`
