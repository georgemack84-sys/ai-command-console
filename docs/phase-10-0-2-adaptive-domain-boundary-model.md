# Phase 10.0.2 - Adaptive Domain Boundary Model

## Preview

Phase 10.0.2 defines the immutable adaptive domain boundary model that classifies where Adaptive Intelligence may analyze, simulate, recommend, or must refuse to act.

## Tightened Contract

The implementation exposes:

- `AdaptiveDomainDefinition` for domain identity, classification, permissions, governance/operator review requirements, replay/certification requirements, constitutional and governance references, and integrity.
- `AdaptiveDomainRestrictionRegistry` for append-only allowed, restricted, and prohibited domain registration with default-deny behavior.
- `AdaptiveBoundaryRequest` and `AdaptiveBoundaryEnforcementResult` for deterministic domain lookup, classification validation, permission verification, governance verification, replay verification, and pass/restrict/reject outcomes.
- `AdaptiveBoundaryReplayModel` for reproducible boundary decisions.
- `AdaptiveBoundaryCertificationReport`, `AdaptiveBoundaryLedgerEntry`, and `AdaptiveBoundaryValidation` for certification, audit, and fail-closed enforcement.

## Fail-Closed Validation

Boundary validation blocks on invalid contract foundation, unknown domains, hidden domains, unauthorized domain creation, missing classifications, permission/classification mismatch, missing governance or operator review, missing replay or certification requirements, invalid constitutional references, authority escalation, tenant isolation breach, cross-tenant memory sharing, prohibited recommendation or mutation, execution authority, weakened inheritance, replay mismatch, integrity mismatch, fail-open behavior, or authorization failure.

## Implementation

- Types: `types/adaptive-domain-boundary-model.ts`
- Service: `services/adaptive-domain-boundary-model/index.ts`
- Tests: `tests/unit/adaptive-domain-boundary-model/adaptiveDomainBoundaryModel.test.ts`

Primary API:

- `runAdaptiveDomainBoundaryModel(input?)`
- `replayAdaptiveDomainBoundaryModel(result)`
- `computeAdaptiveDomainHash(record)`
- `getAdaptiveDomainBoundaryFoundation()`
- `AdaptiveDomainBoundaryModel.run(...)`
- `AdaptiveDomainBoundaryModel.replay(...)`
