# Mission Control Phase 9.7.1 - Governance Decision Filter Contract

## Preview

Phase 9.7.1 establishes the canonical contract every orchestrated decision must satisfy before entering governance and constitutional filtering. It standardizes governance metadata, lifecycle state, replay references, evidence lineage, integrity hashing, tenant ownership, and advisory-only constraints without performing policy, constitutional, authority, or tenant enforcement.

## Tightened Contract

- Governance decision records are deterministic, immutable, tenant-bound, replayable, and integrity protected.
- Validation rejects missing required fields, duplicate identifiers, invalid enum values, invalid lifecycle transitions, unresolved validation or evidence refs, missing replay refs, incomplete lineage, integrity drift, tenant ambiguity, tenant leakage, and advisory-only violations.
- Lifecycle movement is ordered: `CREATED -> REGISTERED -> VALIDATED -> READY_FOR_ENFORCEMENT -> UNDER_ENFORCEMENT -> FINALIZED -> ARCHIVED`.
- The contract can describe a governance disposition but does not authorize execution.
- Replay reconstructs the canonical record and lifecycle audit events byte-for-byte from immutable metadata.

## Implementation

- Types: `types/governance-decision-filter-contract.ts`
- Service: `services/governance-decision-filter-contract/index.ts`
- Tests: `tests/unit/governance-decision-filter-contract/governanceDecisionFilterContract.test.ts`

## Certification Evidence

The service publishes `getGovernanceDecisionFilterContractFoundation()`, plus create, validate, transition, replay, and hash APIs. The default foundation advances a deterministic record to `READY_FOR_ENFORCEMENT` and verifies schema, integrity, replay, observability, tenant isolation, and advisory-only structure.
