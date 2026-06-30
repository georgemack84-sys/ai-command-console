# Phase 7I.3 Governance Tamper Detection

Phase 7I.3 turns the Governance Hash Chain into an active integrity defense. It monitors hash-chain outputs, detects unauthorized governance changes, classifies integrity violations, writes append-only Truth Ledger style events, and produces deterministic response actions.

## Surface

- Types: `types/governance-tamper-detection.ts`
- Engine: `services/governance-tamper-detection/index.ts`
- API: `app/api/governance-tamper-detection/*`
- Tests: `tests/unit/governance-tamper-detection/governanceTamperDetection.test.ts`

## Detection Coverage

The detector consumes Phase 7I.2 hash-chain executions and monitors:

- Hash mismatches and unsupported hash versions
- Missing, duplicated, reordered, or broken chain links
- Lineage parent/root failures
- Replay reconstruction mismatches
- Immutable identity modifications
- Cross-tenant references
- Verification delays and missing metadata
- Unknown integrity state attempts

## Failure Classification

The engine classifies findings as `VALID`, `DEGRADED`, or `CORRUPTED`.

- Corrupted: hash mismatch, missing chain link, duplicate position, previous/root hash mismatch, replay mismatch, parent/root lineage failure, identity modification, cross-tenant reference, unauthorized insertion/deletion, chain reordering, unknown integrity state.
- Degraded: unsupported hash version, verification delay, missing optional metadata.

Corruption blocks downstream governance use; degraded findings notify the operator and schedule revalidation.

## API

- `GET /api/governance-tamper-detection/contract`
- `POST /api/governance-tamper-detection/run`
- `POST /api/governance-tamper-detection/validate`
- `POST /api/governance-tamper-detection/classify`
- `POST /api/governance-tamper-detection/events`
- `POST /api/governance-tamper-detection/response`
- `GET|POST /api/governance-tamper-detection/inspect`

All routes require workspace membership and return the standard API response envelope.

## Developer Notes

Use `runGovernanceTamperDetection()` for a full report and `buildGovernanceTamperObservabilitySurface()` for operator diagnostics. Scenario inputs provide deterministic fixtures for every 7I.3 failure matrix entry and prepare the output shape for Phase 7I.4 Integrity Verification Service.
