# Phase 7I.5 Governance Integrity Certification Gate

Phase 7I.5 is the production certification gate for the Governance Integrity Framework. It certifies that Phase 7I.1 through 7I.4 operate deterministically, cryptographically, replayably, explainably, tenant-safely, and fail closed.

## Surface

- Types: `types/governance-integrity-certification.ts`
- Service: `services/governance-integrity-certification/index.ts`
- API: `app/api/governance-integrity-certification/*`
- Tests: `tests/unit/governance-integrity-certification/governanceIntegrityCertification.test.ts`

## Certification States

- `PASS`: all mandatory and optional certification tests pass and verification integrity is valid.
- `CONDITIONAL_PASS`: mandatory controls pass, but non-critical reporting or observability gaps remain.
- `FAIL`: any mandatory integrity control fails.

## Certified Controls

- Integrity contract validity
- Canonical serialization determinism
- Content, canonical, previous, and root hash reproducibility
- Governance hash chain completeness and ordering
- Lineage reconstruction
- Replay integrity
- Tamper detection
- Immutable identity protection
- Evidence integrity
- Tenant isolation
- Verification determinism
- Integrity state classification
- Truth Ledger recording
- Operator visibility

## API

- `GET /api/governance-integrity-certification/contract`
- `POST /api/governance-integrity-certification/run`
- `POST /api/governance-integrity-certification/validate`
- `POST /api/governance-integrity-certification/hash`
- `POST /api/governance-integrity-certification/evidence`
- `POST /api/governance-integrity-certification/tests`
- `GET|POST /api/governance-integrity-certification/inspect`

All routes require workspace membership and return the standard API response envelope.

## Developer Notes

Use `runGovernanceIntegrityCertification()` to execute the certification suite and `validateGovernanceIntegrityCertificationReport()` to validate a produced report. Scenario inputs provide deterministic negative certification fixtures for every mandatory gate failure.
