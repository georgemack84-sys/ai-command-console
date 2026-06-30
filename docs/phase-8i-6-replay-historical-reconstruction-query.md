# Phase 8I.6 - Replay & Historical Reconstruction Queries

## Purpose

Phase 8I.6 provides deterministic, read-only reconstruction of autonomous behavior from immutable historical evidence. It combines planning, execution, delegation, orchestration, supervision, intervention, replay, integrity, governance, and lineage records into one replay-compatible timeline.

The reconstruction framework never recreates missing history through inference or approximation. Missing records and mismatches are reported as evidence gaps or divergence points.

## Implementation

- `types/replay-historical-reconstruction-query.ts` defines replay states, reconstructed events, missing records, mismatch records, reconstruction records, replay result views, audit records, inputs, responses, and observability surfaces.
- `services/replay-historical-reconstruction-query/index.ts` composes 8I.3 Plan & Execution Lookup, 8I.4 Delegation & Orchestration Lookup, and 8I.5 Supervision, Intervention & Boundary Lookup into a canonical historical reconstruction.
- `app/api/replay-historical-reconstruction-query/*` exposes contract, full lookup, reconstruction, replay result, missing record, mismatch, timeline, and inspect/validation endpoints.
- `tests/unit/replay-historical-reconstruction-query/replayHistoricalReconstructionQuery.test.ts` verifies doctrine, deterministic timelines, cross-service evidence composition, missing record reporting, mismatch reporting, replay statuses, and fail-closed error mapping.

## Replay States

- `REPRODUCED`: reconstructed history matches certified historical records.
- `MISMATCH`: one or more replay, lineage, hash, ordering, integrity, or policy records diverged.
- `INCOMPLETE`: reconstruction cannot complete because required historical evidence is absent.
- `INVALID`: reconstruction cannot be trusted because integrity or hash evidence failed.

## Canonical Timeline

The reconstruction model orders events as:

1. Mission objective
2. Planning
3. Decision
4. Delegation
5. Orchestration
6. Execution
7. Supervision
8. Intervention
9. Outcome
10. Replay
11. Integrity verification

Every event preserves original timestamps, input references, policy references, governance references, constitutional references, authority references, replay references, lineage references, execution hashes, replay hashes, and integrity hashes.

## Read-Only Guarantees

The framework may reconstruct history, inspect replay records, inspect integrity records, correlate evidence, identify missing records, and identify mismatches. It may never alter historical records, regenerate missing history, rewrite replay, modify lineage, modify integrity hashes, modify governance evidence, or change execution outcomes.
