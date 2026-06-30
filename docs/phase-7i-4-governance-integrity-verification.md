# Phase 7I.4 Governance Integrity Verification

Phase 7I.4 provides the single deterministic verification service for Governance Intelligence integrity. It consolidates the 7I.1 integrity contract, 7I.2 hash chain, and 7I.3 tamper detection into one authoritative trust decision before governance data is consumed, replayed, certified, or used downstream.

## Surface

- Types: `types/governance-integrity-verification.ts`
- Service: `services/governance-integrity-verification/index.ts`
- API: `app/api/governance-integrity-verification/*`
- Tests: `tests/unit/governance-integrity-verification/governanceIntegrityVerification.test.ts`

## Verification Pipeline

The service verifies:

- Contract schema and mandatory metadata
- Immutable identity fields
- Canonical, content, previous, and root hashes
- Governance chain completeness and ordering
- Lineage reconstruction
- Replay reconstruction
- Evidence references and lineage
- Tenant isolation
- Final integrity decision

## Modes

- `CONTINUOUS`
- `SCHEDULED`
- `ON_DEMAND`

## Failure Rules

Corrupted failures block downstream trust and certification:

- `CONTRACT_SCHEMA_INVALID`
- `IMMUTABLE_IDENTITY_MODIFIED`
- `CONTENT_HASH_MISMATCH`
- `PREVIOUS_HASH_MISMATCH`
- `ROOT_HASH_MISMATCH`
- `GOVERNANCE_CHAIN_INCOMPLETE`
- `LINEAGE_RECONSTRUCTION_FAILED`
- `REPLAY_RECONSTRUCTION_MISMATCH`
- `CROSS_TENANT_REFERENCE_DETECTED`
- `EVIDENCE_LINEAGE_BROKEN`
- `UNKNOWN_VERIFICATION_STATE`

Degraded failures require operator review and revalidation:

- `UNSUPPORTED_VERIFICATION_VERSION`
- `OPTIONAL_METADATA_UNAVAILABLE`
- `DELAYED_VERIFICATION_EXECUTION`

## API

- `GET /api/governance-integrity-verification/contract`
- `POST /api/governance-integrity-verification/run`
- `POST /api/governance-integrity-verification/validate`
- `POST /api/governance-integrity-verification/classify`
- `POST /api/governance-integrity-verification/evidence`
- `POST /api/governance-integrity-verification/ledger`
- `POST /api/governance-integrity-verification/results`
- `GET|POST /api/governance-integrity-verification/inspect`

All routes require workspace membership and return the standard API response envelope.

## Developer Notes

Use `runGovernanceIntegrityVerification()` for complete verification reports and `buildGovernanceIntegrityVerificationObservabilitySurface()` for operator dashboards. The report includes supporting evidence, replay references, lineage references, module-level results, an append-only Truth Ledger verification record, and a certification readiness decision for Phase 7I.5.
