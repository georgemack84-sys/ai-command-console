# Phase 7H.2 - Governance Input Reconstruction

## Purpose

Phase 7H.2 reconstructs every input required to replay Governance Intelligence from immutable historical records. It starts from the Phase 7H.1 Governance Replay Contract, restores the complete governance context, and produces a deterministic replay input package for later state reconstruction and output verification.

## Implemented Surface

- `types/governance-input-reconstruction.ts` defines the replay input package, immutable input records, context categories, integrity results, validation failures, audit entries, and observability surface.
- `services/governance-input-reconstruction/index.ts` implements the reconstruction engine, Truth Ledger resolver, context loaders, configuration restorer, input validator, package hash generator, and audit logger.
- `app/api/governance-input-reconstruction/*` exposes secured endpoints for reconstruction, validation, hashing, Truth Ledger resolution, governance context, policy context, evidence, lineage, configuration, audit, and inspection.
- `tests/unit/governance-input-reconstruction/governanceInputReconstruction.test.ts` verifies deterministic reconstruction and fail-closed behavior.

## Reconstructed Contexts

- Governance context
- Constitutional context
- Policy context
- Compliance context
- Risk context
- Recommendation context
- Escalation context
- Evidence context
- Lineage context
- Configuration context

## Guarantees

- Inputs are reconstructed only from immutable ledger or graph sources.
- Historical versions and timestamps are preserved.
- Processing order is deterministic and independent of retrieval timing.
- Tenant, authority, and constitutional context must match the replay contract.
- Evidence and lineage records are restored with integrity checks.
- Replay input package hashes are reproducible.
- Live, mutable, inferred, or undocumented input state is rejected.
- Audit logs record reconstructed artifacts, validation results, integrity status, and duration.

## API Endpoints

- `GET /api/governance-input-reconstruction/contract`
- `POST /api/governance-input-reconstruction/reconstruct`
- `POST /api/governance-input-reconstruction/validate`
- `POST /api/governance-input-reconstruction/hash`
- `POST /api/governance-input-reconstruction/truth-ledger`
- `POST /api/governance-input-reconstruction/governance-context`
- `POST /api/governance-input-reconstruction/policy-context`
- `POST /api/governance-input-reconstruction/evidence`
- `POST /api/governance-input-reconstruction/lineage`
- `POST /api/governance-input-reconstruction/config`
- `POST /api/governance-input-reconstruction/audit`
- `GET|POST /api/governance-input-reconstruction/inspect`

## Exit Criteria

Phase 7H.2 is complete when governance execution context, constitutional controls, policies, compliance, risk, recommendations, escalations, evidence, lineage, and deterministic configuration are restored into a complete replay input package, all integrity checks pass, tenant isolation is enforced, audit logging is operational, and incomplete or non-deterministic reconstruction fails closed.
