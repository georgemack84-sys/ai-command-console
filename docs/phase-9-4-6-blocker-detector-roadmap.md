# Phase 9.4.6 - Blocker Detector Roadmap

## Preview

Phase 9.4.6 detects per-decision blockers after dependency and conflict validation, before graph ordering or orchestration. It identifies decisions that may be valid in isolation but are not yet eligible to proceed.

## Tightened Scope

The detector consumes graph nodes, requirement relationships, dependency validation results, conflict detection results, and explicit blocker signals. It does not infer hidden blockers. Every blocker must carry governance refs, replay refs, evidence, a required action, and deterministic lineage.

## Implementation

Implemented in `services/decision-graph/blockerDetector.ts`.

Primary APIs:

- `detectDecisionBlockers`
- `BlockerDetector`

Produced artifacts:

- `BlockerRecord`
- `BlockerExplanation`
- `BlockerLedgerRecord`
- updated node snapshots with `blocker_refs`
- blocked/eligible node lists
- replay validation package

## Fail-Closed Rules

The detector fails closed on:

- unclassified blockers
- missing governance refs
- missing replay refs
- incomplete authority validation
- incomplete dependency validation
- relationship integrity mismatch
- replay mismatch
- tenant isolation violation
- constitutional violation
- hidden blockers
- incomplete blocker explanations

## Determinism

Detection uses stable blocker keys, deterministic severity rules, canonical sorting, reproducible hashes, immutable ledger records, and no runtime-only context. Blocked nodes move to `BLOCKED` and are excluded from ordering and approval eligibility.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-graph\blockerDetector.test.ts tests\unit\decision-graph\conflictDetector.test.ts tests\unit\decision-graph\dependencyValidator.test.ts tests\unit\decision-graph\decisionRelationshipResolver.test.ts
```

Result: 4 files, 19 tests passed.
