# Phase 9.10.8 - Immutable Decision Ledger

## Preview

The Immutable Decision Ledger persists the replay, audit, integrity, divergence, operator, and certification evidence chain as deterministic append-only records. It is the authoritative historical store for replay, audit, forensics, governance review, and certification.

## Tightened Contract

- Every required ledger type is committed with deterministic identity, sequence, timestamp, lineage, and integrity hash.
- Records are append-only and cannot be updated, deleted, replaced, reordered, or retroactively inserted.
- Parent-child lineage links replay request, replay execution, replay outcome, audit report, operator review, divergence report, integrity verification, and certification evidence.
- Queries are deterministic, tenant-isolated, read-only, and never mutate ledger contents.
- Duplicate identities, hash mismatches, broken lineage, unsupported types or schemas, tenant boundary violations, incomplete validation, unknown lifecycle state, and append-only violations fail closed.

## Implementation

- Types: `types/immutable-decision-ledger.ts`
- Service: `services/immutable-decision-ledger/index.ts`
- Tests: `tests/unit/immutable-decision-ledger/immutableDecisionLedger.test.ts`

The service provides ledger schema definitions, canonical hashing, append-only commit management, lineage validation, deterministic read-only query APIs, and fail-closed enforcement for Phase 9.10 evidence preservation.
