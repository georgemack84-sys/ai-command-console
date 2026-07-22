# Phase 10.13G - Governance-Aware Memory Control

## Purpose

Build the constitutional control layer for Adaptive Memory retrieval and reuse.

Historical memory may not be retrieved or reused until identity, authority, constitutional, governance, mission, replay, reuse-policy, and integrity validation complete. Memory may inform recommendations, but it never grants authority, overrides governance, or bypasses constitutional protections.

## Tightened Contract

- Control version: `governance-aware-memory-control/v1`
- Control identifier: `GovernanceAwareMemoryControl`
- Required predecessor: Phase 10.13F Memory Qualification & Validation
- Decision outcomes: `APPROVED`, `DENIED`, `REQUIRES_GOVERNANCE_REVIEW`, `REQUIRES_OPERATOR_APPROVAL`, `REQUIRES_CERTIFICATION`
- Cross-tenant behavior: blocked by default unless explicitly authorized with constitutional approval, governance approval, certified anonymization, and immutable audit trail

## Invariants

Governance runs before memory. The constitution is supreme. Memory never expands authority. Replay is mandatory before reuse. Mission scope and tenant boundaries are enforced deterministically for every request.

## Failure Behavior

Reuse is rejected when unauthorized memory is reused, governance validation is bypassed, constitutional protections are violated, authority is incorrectly granted, replay validation is omitted, mission authorization is ignored, tenant isolation is violated, reuse policy is circumvented, governance decisions become nondeterministic, or integrity verification fails.

## Implementation

- Types: `types/governance-aware-memory-control.ts`
- Service: `services/governance-aware-memory-control/index.ts`
- API routes: `app/api/governance-aware-memory-control/*`
- Tests: `tests/unit/governance-aware-memory-control/governanceAwareMemoryControl.test.ts`

The exported service exposes `establishGovernanceAwareMemoryControl`, `replayGovernanceAwareMemoryControl`, and `getGovernanceAwareMemoryControl`.
