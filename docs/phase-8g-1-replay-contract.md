# Phase 8G.1 - Replay Contract

## Purpose

The Replay Contract establishes the deterministic contract for reconstructing autonomous behavior across Mission Control. It defines replay identity, scope, artifacts, ordering guarantees, integrity validation, confidence scoring, governance references, lifecycle states, and fail-closed validation before reconstruction begins.

## Delivered

- Replay Contract: `services/replay-contract`
- Canonical replay schemas: `types/replay-contract.ts`
- Boundary Certification Gate integration
- Replay identity, references, artifact manifest, ordering guarantee, integrity record, confidence assessment, governance references, validation result, and visibility surface
- API routes under `/api/replay-contract`
- Unit coverage in `tests/unit/replay-contract/replayContract.test.ts`

## API Surface

- `GET /api/replay-contract/contract`
- `POST /api/replay-contract/register`
- `POST /api/replay-contract/artifacts`
- `POST /api/replay-contract/validate`
- `POST /api/replay-contract/package`
- `GET /api/replay-contract/inspect`
- `POST /api/replay-contract/inspect`

## Guarantees

- Immutable replay identities and globally stable replay references
- Standardized replay types, scopes, lifecycle states, artifact requirements, ordering rules, and confidence levels
- Deterministic ordering: Mission, Planning, Decision, Delegation, Orchestration, Execution, Supervision, Intervention, Outcome, Completion
- Cryptographic verification for planning, decision, orchestration, delegation, supervision, execution, intervention, mission, replay, and Truth Ledger hashes
- Fail-closed validation for missing artifacts, hash failures, ordering mismatches, governance failures, lineage gaps, tenant violations, low confidence, duplicate identity, constitution mismatch, missing authority, and integrity mismatch
