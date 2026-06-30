# Phase 8A.1 - Autonomy Contract

## Purpose

The Autonomy Contract is the immutable birth certificate for Controlled Autonomy instances in Mission Control. It binds every planner, orchestrator, supervisor, recovery service, and future autonomous service to a deterministic identity, tenant, mission, governance profile, constitutional profile, authority boundary, lifecycle state, replay seed, lineage record, and certification hash.

## Implemented Artifacts

- `types/autonomy-contract.ts` defines the contract schema, lifecycle states, validation failures, registry, version policy, and observability surface.
- `services/autonomy-contract/index.ts` builds frozen contracts, computes canonical integrity hashes, validates governance and constitutional references, enforces authority boundaries, reconstructs lineage, manages registry metadata, and publishes version policy.
- `app/api/autonomy-contract/*` exposes authenticated contract, create, validate, hash, registry, version, and inspect endpoints.
- `tests/unit/autonomy-contract/autonomyContract.test.ts` verifies baseline certification readiness and failure modes.

## Contract Sections

- Identity: `autonomy_id`, `autonomy_type`, `mission_id`, `tenant_id`, and schema `version`.
- Governance: profile, version, policy set, and mode.
- Constitution: profile, constitution version, and revision.
- Authority: scope, profile, operator approval requirement, and execution permissions.
- Lifecycle: current state, lifecycle version, activation timestamp, and retirement timestamp.
- Replay: replay reference, replay version, and deterministic seed.
- Lineage: lineage reference, parent autonomy, root autonomy, and generation.
- Certification: certification state, framework version, integrity hash, creator, and creation timestamp.

## Validation Guarantees

The validation engine rejects missing identity fields, duplicate autonomy IDs, missing missions, tenant mismatches, unsupported autonomy types, unsupported schema versions, missing governance or constitutional profiles, unknown policy sets, authority escalation, unauthorized permissions, invalid lifecycle states, duplicate replay references, non-deterministic replay seeds, broken or circular lineage, cross-tenant lineage, integrity hash mismatches, and protected field mutation.

## Registry And Versioning

The registry stores registered contracts, active versions, historical versions, and a deterministic audit trail. Version policy is explicit: Phase 8A.1 supports `autonomy-contract/v8A.1` with semantic version `8.1.0`. Structural evolution requires a new contract identity and preserved lineage.

## Certification Readiness

The contract is certification-ready when validation passes with no failures, the integrity hash recomputes exactly, replay metadata is deterministic, authority does not exceed governance mode, constitutional and governance references resolve, and lineage remains tenant-isolated and reconstructable.
