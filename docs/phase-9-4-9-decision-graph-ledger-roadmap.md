# Phase 9.4.9 - Decision Graph Ledger Roadmap

## Preview

Phase 9.4.9 persists the Decision Dependency Graph lifecycle as an immutable, append-only, replayable ledger. It becomes the authoritative record for graph creation, nodes, relationships, validation evidence, safety evidence, ordering, snapshots, and replay.

## Tightened Scope

The ledger consumes graph nodes, relationships, optional validation artifacts, optional safety artifacts, and optional ordering artifacts. It serializes lifecycle events into deterministic ledger entries, chains each entry to the previous hash, records graph snapshots, validates relationship lineage, and emits replay evidence.

## Implementation

Implemented in `services/decision-graph/decisionGraphLedger.ts`.

Primary APIs:

- `persistDecisionGraphLedger`
- `DecisionGraphLedger`

Produced artifacts:

- `DecisionGraphLedgerRecord`
- `GraphSnapshotRecord`
- `RelationshipGraphLedgerRecord`
- `LedgerIntegrityRecord`
- `GraphReplayLedgerRecord`
- chained append-only entry sequence
- replay validation hash

## Fail-Closed Rules

The ledger fails closed on:

- hidden ledger mutation references
- graph version mismatch
- append-only hash mismatch
- tampered existing ledger entries
- relationship integrity mismatch
- missing relationship lineage
- missing governance references
- missing replay references
- tenant or mission isolation violation
- replay reconstruction mismatch

## Determinism

Ledger entries use canonical ordering, stable sequence numbers, deterministic entry ids, reproducible hashes, and a previous-entry hash chain. Timestamps are stable ledger references rather than wall-clock ordering inputs.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-graph\decisionGraphLedger.test.ts tests\unit\decision-graph\graphOrderingEngine.test.ts tests\unit\decision-graph\graphSafetyValidator.test.ts
```

Result: 3 files, 13 tests passed.
