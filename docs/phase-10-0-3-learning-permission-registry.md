# Phase 10.0.3 - Learning Permission Registry

## Preview

Phase 10.0.3 establishes the Learning Permission Registry as the constitutional allowlist for adaptive capabilities. A domain boundary may permit a class of activity, but no adaptive capability may run unless an active, certified, replayable, governed permission authorizes it.

## Tightened Contract

The implementation exposes:

- `LearningPermission` for permission identity, capability, tenant and mission scope, authorized scope and operations, governance, replay, certification, operator, expiration, rollback, lifecycle, and integrity.
- `LearningPermissionRegistryRecord` for append-only active, suspended, revoked, and expired permission tracking with default-deny behavior.
- `LearningPermissionRequest` and `LearningPermissionValidationDecision` for deterministic permission lookup and allow/reject outcomes.
- `LearningPermissionReplayModel` for reproducible authorization decisions.
- `LearningPermissionCertificationReport`, immutable `LearningPermissionLedgerEntry` records, and `LearningPermissionValidation`.

## Fail-Closed Validation

Permission validation blocks on invalid boundary model, missing permission, inactive/expired/revoked permission, capability mismatch, tenant or mission mismatch, authorized scope mismatch, missing governance approval, missing certification, missing replay references, missing rollback support, integrity mismatch, unauthorized capability creation, hidden or implicit permissions, permission forgery, governance or replay bypass, tenant crossover, authority escalation, fail-open behavior, authorization failure, or execution authority.

## Implementation

- Types: `types/learning-permission-registry.ts`
- Service: `services/learning-permission-registry/index.ts`
- Tests: `tests/unit/learning-permission-registry/learningPermissionRegistry.test.ts`

Primary API:

- `runLearningPermissionRegistry(input?)`
- `replayLearningPermissionRegistry(result)`
- `computeLearningPermissionHash(record)`
- `getLearningPermissionRegistryFoundation()`
- `LearningPermissionRegistry.run(...)`
- `LearningPermissionRegistry.replay(...)`
