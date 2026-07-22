# Phase 9.6.1 - Conflict Detection Contract

## Preview

Phase 9.6.1 establishes the canonical contract for representing decision conflicts as deterministic, replayable, governance-aware, constitutionally constrained, advisory-only records.

## Tightened Scope

- Conflicts are first-class immutable objects with tenant, mission, candidate, evidence, governance, constitutional, authority, lineage, replay, and integrity metadata.
- Detection rules are versioned, hash-protected, and explicit about evidence, governance, authority, replay, and deterministic threshold requirements.
- Lifecycle movement is limited to the Phase 9.6.1 transition table and every transition produces an immutable audit entry.
- Arbitration is not performed in this phase; the contract only emits the canonical arbitration request for downstream arbitration.
- Validation fails closed for missing required metadata, duplicate identifiers, invalid transitions, integrity drift, replay corruption, tenant leaks, constitutional violations, or advisory-only violations.

## Implemented Surface

- `registerConflict` creates deterministic conflict records and rejects invalid registrations without returning a partial conflict.
- `classifyConflict` assigns deterministic severity and escalation requirements.
- `transitionConflictLifecycle` validates lifecycle movement and records immutable transition evidence.
- `generateConflictArbitrationRequest` creates the Phase 9.6 arbitration boundary object.
- `validateConflict` checks schema, governance, constitutional, authority, replay, lineage, tenant isolation, advisory-only, and integrity requirements.
- `replayConflict` reconstructs conflict integrity, lifecycle audit entries, and arbitration request fidelity.
- `buildConflictDetectionObservability` reports conflict counts, distributions, success rates, arbitration generation, and fail-closed events.

## Exit Criteria Coverage

- Canonical schema and supported categories are defined in `types/decision-conflict-detection-contract.ts`.
- Lifecycle transitions are encoded in `ALLOWED_CONFLICT_TRANSITIONS`.
- Detection rules and arbitration requests are hash-protected.
- Replay never infers missing data and fails closed on mismatches.
- Governance, constitutional, lineage, replay, integrity, and advisory-only requirements are mandatory validation concerns.
