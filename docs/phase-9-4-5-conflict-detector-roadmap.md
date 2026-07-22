# Phase 9.4.5 - Conflict Detector Roadmap

## Preview

Phase 9.4.5 detects incompatible decision graph nodes after dependency validation and before graph ordering or orchestration. It blocks conflicting decisions, records immutable evidence, and produces deterministic explanations that replay identically.

## Tightened Scope

The detector consumes graph nodes, resolver relationships, relationship lineage, and explicit conflict signals. It does not infer hidden conflicts. Conflicts come from `conflicts_with` relationships or recorded policy, authority, mission, tenant, risk, action, governance, certification, recovery, or dependency signals.

## Implementation

Implemented in `services/decision-graph/conflictDetector.ts`.

Primary APIs:

- `detectDecisionConflicts`
- `ConflictDetector`

Produced artifacts:

- `ConflictRecord`
- `ConflictExplanation`
- `ConflictLedgerRecord`
- updated node snapshots with `conflict_refs`
- replay validation package

## Fail-Closed Rules

The detector fails closed on:

- unclassified conflicts
- missing governance refs
- missing replay refs
- incomplete authority validation
- graph integrity mismatch
- tenant boundary violation
- replay mismatch
- hidden conflict signals
- ambiguous rules
- incomplete conflict explanations

## Determinism

Detection uses stable conflict keys, deterministic severity rules, canonical sorting, reproducible hashes, immutable ledger records, and no wall-clock timestamps or hidden runtime context. Confirmed blocking conflicts move affected nodes to `CONFLICT_DETECTED`.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-graph\conflictDetector.test.ts tests\unit\decision-graph\dependencyValidator.test.ts tests\unit\decision-graph\decisionRelationshipResolver.test.ts
```

Result: 3 files, 15 tests passed.
