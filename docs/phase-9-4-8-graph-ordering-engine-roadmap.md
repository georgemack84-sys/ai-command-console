# Phase 9.4.8 - Graph Ordering Engine Roadmap

## Preview

Phase 9.4.8 turns a validated, safe decision graph into the canonical execution sequence for eligible nodes. It preserves dependency precedence, excludes nodes that are blocked or not ready, and records replayable ordering evidence.

## Tightened Scope

The ordering engine consumes graph nodes, relationship records, and a successful graph safety result. It performs deterministic topological ordering over eligible nodes, applies stable tie-breakers, emits explanations and ledger records, and verifies that replay reconstructs the identical ordering hash.

## Implementation

Implemented in `services/decision-graph/graphOrderingEngine.ts`.

Primary APIs:

- `orderDecisionGraph`
- `GraphOrderingEngine`

Produced artifacts:

- `GraphOrderingRecord`
- `ReplayOrderingRecord`
- `OrderingExplanation`
- `OrderingLedgerRecord`
- updated node snapshots with `ORDERED` state
- ordered and excluded node lists
- replay validation hash

## Fail-Closed Rules

The engine fails closed on:

- invalid graph safety status
- graph version mismatch
- relationship integrity mismatch
- blocked or conflicted nodes entering active ordering
- missing governance evidence
- missing replay evidence
- pending certification
- dependency order violation
- hidden ordering references
- random ordering requests
- replay hash mismatch

## Determinism

Ordering uses a stable topological sort over `depends_on` relationships. When multiple nodes are ready at the same time, ties are resolved by deterministic readiness and evidence signals, priority, candidate sequence, and stable node id. The engine does not use randomness, wall-clock timestamps, mutable caches, or hidden ranking logic.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-graph\graphOrderingEngine.test.ts tests\unit\decision-graph\graphSafetyValidator.test.ts tests\unit\decision-graph\blockerDetector.test.ts tests\unit\decision-graph\conflictDetector.test.ts tests\unit\decision-graph\dependencyValidator.test.ts tests\unit\decision-graph\decisionRelationshipResolver.test.ts
```

Result: 6 files, 29 tests passed.
