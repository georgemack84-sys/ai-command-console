# Mission Control Phase 9.1.1 - Decision Contract Foundation

## Purpose

Phase 9.1.1 establishes the canonical Decision Contract for every orchestrated decision in Mission Control. The contract is the foundation for Decision Orchestration: it defines required metadata, governance and constitutional evidence, replay requirements, deterministic serialization, semantic versioning, compatibility checks, integrity hashing, and advisory-only authority boundaries.

The contract does not orchestrate, evaluate, rank, prioritize, approve, execute, mutate policy, or start workflows. It only defines and validates the deterministic shape that later Phase 9 decision components must produce and consume.

## Canonical Implementation

- `types/decision-contract.ts`
- `services/decision-contract/index.ts`
- `tests/unit/decision-contract/decisionContract.test.ts`

## Required Fields

Every Decision Contract must include:

- `contract_version`
- `orchestration_id`
- `tenant_id`
- `mission_id`
- `decision_subject`
- `decision_type`
- `decision_priority`
- `decision_source`
- `governance_requirements`
- `constitutional_requirements`
- `replay_requirements`
- `validation_rules`
- `integrity_algorithm`
- `created_at`

The implementation also carries `lineage_requirements`, `serialization_rules`, `compatibility_version`, `authority_boundary`, optional extension fields, and the computed `integrity_hash`.

## Guarantees

The foundation enforces:

- deterministic parsing, validation, serialization, replay metadata, and integrity hashing
- semantic versioning with supported major-version compatibility
- mandatory governance and constitutional references
- append-only lineage requirements
- tenant-isolated references
- normalized UTC timestamps
- SHA-256 integrity verification
- advisory-only authority with execution, mutation, deployment, authority escalation, evidence rewrite, learning, and self-optimization disabled
- fail-closed validation for missing, incompatible, cross-tenant, hidden, or nondeterministic behavior

## Deterministic Serialization

`serializeDecisionContract()` emits canonical JSON with stable property ordering, UTF-8-compatible string content, deterministic number formatting, deterministic null handling, and no integrity hash in the serialized source. `computeDecisionContractIntegrityHash()` hashes that canonical representation with SHA-256, so identical inputs produce identical serialized output and identical hashes.

## APIs

- `createDecisionContract()`
- `validateDecisionContract()`
- `validateContractVersion()`
- `validateCompatibility()`
- `validateIntegrityHash()`
- `serializeDecisionContract()`
- `computeDecisionContractIntegrityHash()`
- `buildDecisionContractObservabilityMetrics()`
- `getDecisionContractFoundation()`

## Exit Criteria

Phase 9.1.1 is complete when the canonical Decision Contract is published, required and optional fields are defined, semantic versioning and compatibility checks are operational, deterministic serialization and SHA-256 integrity are reproducible, governance and constitutional references are mandatory, tenant isolation and replay metadata are validated, advisory-only authority is enforced, and the foundation is covered by focused unit tests.
