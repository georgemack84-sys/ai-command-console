# Phase 9.10.2 - Replay Snapshot Capture

## Preview

Replay Snapshot Capture is the immutable evidence layer for deterministic decision replay. It captures every mandatory orchestration stage as a versioned, serialized, integrity-hashed snapshot before replay execution can proceed.

## Tightened Contract

- The capture engine emits one immutable snapshot for each required orchestration domain.
- Snapshot content is canonically serialized before hashing.
- Snapshot identity, schema, lifecycle, lineage, replay refs, governance refs, and constitutional refs are mandatory.
- Registry entries and ledger entries are derived from captured snapshots and must stay complete.
- The ledger is append-only, ordered, non-deleting, and hash-verifiable.
- Replay readiness is blocked when any required snapshot is missing, duplicated, corrupted, cross-tenant, missing lineage, missing governance or constitutional refs, unsupported, or not committed to the ledger.
- Snapshot capture is advisory-only and never mutates original orchestration data.

## Implementation

- Types: `types/decision-replay-snapshot-capture.ts`
- Service: `services/decision-replay-snapshot-capture/index.ts`
- Tests: `tests/unit/decision-replay-snapshot-capture/decisionReplaySnapshotCapture.test.ts`

The service builds the snapshot identity framework, serializer, validator, registry, lineage manager, immutable ledger, coverage verifier, and replay readiness gate for Phase 9.10 snapshot evidence.
