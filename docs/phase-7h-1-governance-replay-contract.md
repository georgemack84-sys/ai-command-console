# Phase 7H.1 - Governance Replay Contract

## Purpose

Phase 7H.1 establishes the canonical, immutable contract required to replay Governance Intelligence deterministically. The contract captures the original governance execution identity, tenant and mission context, replay scope, historical references, reconstruction anchors, deterministic controls, hashes, authorization, and audit events needed before any replay begins.

## Implemented Surface

- `types/governance-replay-contract.ts` defines the replay schema, statuses, scopes, validation failures, dependency records, reference registry, deterministic config, authorization result, audit event, validation result, and observability view.
- `services/governance-replay-contract/index.ts` implements replay identity generation, contract creation, dependency resolution, reference registry creation, deterministic replay config, replay hash generation, authorization validation, audit logging, validation, and contract inspection.
- `app/api/governance-replay-contract/*` exposes secured endpoints for contract, create, validate, hash, dependencies, references, config, authorize, audit, and inspect operations.
- `tests/unit/governance-replay-contract/governanceReplayContract.test.ts` verifies deterministic behavior and fail-closed replay preconditions.

## Contract Guarantees

- Replay identities are deterministic, versioned, and immutable.
- Replay scope is explicitly declared and limited to supported governance replay categories.
- Tenant isolation is enforced through tenant boundary, authority, and reference validation.
- Historical references must resolve before replay readiness is granted.
- Governance lineage, policy lineage, decision influence, explainability, and lineage certification references are preserved from the Phase 7G stack.
- Reconstruction references for input, state, and output verification are mandatory.
- Replay hash, contract hash, certification hash, reconstruction hash, governance hash, and integrity hash are reproducible.
- Deterministic controls prohibit live external data, mutable cache, hidden configuration, and non-deterministic seeds.
- Replay authorization is limited to the governance replay operator role for the originating tenant.
- Audit logging records replay request and validation events with deterministic audit hashes.

## Validation Failures

The contract validator fails closed for:

- missing replay contracts
- duplicate replay identifiers
- missing governance executions
- incomplete evidence
- broken lineage
- replay or contract hash mismatch
- tenant mismatch
- authority mismatch
- constitutional mismatch
- unsupported replay versions
- integrity verification failure
- missing required fields
- immutable metadata mutation
- hidden or non-deterministic replay state
- unauthorized replay requestors

## API Endpoints

- `GET /api/governance-replay-contract/contract`
- `POST /api/governance-replay-contract/create`
- `POST /api/governance-replay-contract/validate`
- `POST /api/governance-replay-contract/hash`
- `POST /api/governance-replay-contract/dependencies`
- `POST /api/governance-replay-contract/references`
- `POST /api/governance-replay-contract/config`
- `POST /api/governance-replay-contract/authorize`
- `POST /api/governance-replay-contract/audit`
- `GET|POST /api/governance-replay-contract/inspect`

## Exit Criteria

Phase 7H.1 is complete when the baseline contract validates as replay-ready, all critical violation scenarios are rejected deterministically, hashes reproduce exactly, dependencies and references are explicit, tenant isolation and replay authorization are enforced, audit logging is operational, and the resulting contract can act as the trusted foundation for Phase 7H.2 input reconstruction.
