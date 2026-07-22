# Phase 9.4.7 - Cycle Detection & Graph Safety Roadmap

## Preview

Phase 9.4.7 validates structural graph safety before ordering or orchestration. It detects circular dependencies, unsafe topology, duplicate edges, isolation violations, and replay divergence, then blocks cyclic nodes fail-closed.

## Tightened Scope

The validator consumes graph nodes and relationship records. It performs deterministic topology traversal, classifies cycles by relationship family, records graph safety evidence, produces loop reports, updates cyclic nodes with blocker refs, and emits a replay package.

## Implementation

Implemented in `services/decision-graph/graphSafetyValidator.ts`.

Primary APIs:

- `validateGraphSafety`
- `GraphSafetyValidator`

Produced artifacts:

- `CycleDetectionRecord`
- `GraphSafetyRecord`
- `DependencyLoopReport`
- `GraphSafetyLedgerRecord`
- updated node snapshots
- replay validation package

## Fail-Closed Rules

The validator fails closed on:

- self-referential cycles
- direct or indirect dependency cycles
- governance, authority, certification, recovery, simulation, or escalation loops
- duplicate edges
- orphan or unreachable nodes
- cross-tenant or cross-mission topology
- graph version mismatch
- relationship integrity mismatch
- hidden topology
- replay mismatch

## Determinism

Cycle detection uses sorted traversal, canonical cycle rotation, stable cycle classification, deterministic severity rules, immutable ledger records, and reproducible hashes. Cyclic nodes are marked `BLOCKED` and excluded from ordering eligibility.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-graph\graphSafetyValidator.test.ts tests\unit\decision-graph\blockerDetector.test.ts tests\unit\decision-graph\conflictDetector.test.ts tests\unit\decision-graph\dependencyValidator.test.ts tests\unit\decision-graph\decisionRelationshipResolver.test.ts
```

Result: 5 files, 24 tests passed.
