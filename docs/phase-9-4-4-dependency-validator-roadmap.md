# Phase 9.4.4 - Dependency Validator Roadmap

## Preview

Phase 9.4.4 validates dependency relationships after relationship resolution and before conflict detection, blocker detection, graph ordering, or orchestration. It proves that dependencies are complete, authorized, replayable, governance-compliant, tenant-scoped, and safe.

## Tightened Scope

The validator consumes graph nodes, relationship records, relationship lineage, and optional expected dependency requirements. It validates dependency relationships created by the 9.4.3 resolver, detects missing prerequisites, verifies immutable evidence, and updates safe nodes to `DEPENDENCY_VALIDATED`.

## Implementation

Implemented in `services/decision-graph/dependencyValidator.ts`.

Primary APIs:

- `validateDecisionDependencies`
- `DependencyValidator`

Produced artifacts:

- `DependencyValidationRecord`
- `MissingDependencyRecord`
- `DependencyValidationLedgerEvent`
- `DependencyValidationReport`
- replay validation package
- updated node snapshots

## Fail-Closed Rules

The validator rejects or blocks on:

- missing expected dependencies
- missing prerequisite decision nodes
- malformed dependency references
- duplicate dependencies
- dependency cycles
- missing relationship lineage
- governance violations
- missing replay refs
- unauthorized authority refs
- cross-tenant dependencies
- cross-mission dependencies
- unresolved prerequisite state
- relationship integrity mismatch
- replay divergence

## Determinism

Validation uses sorted dependency traversal, canonical IDs, immutable validation records, deterministic ledger events, stable replay packages, and reproducible hashes. No execution authority is granted; the result is advisory-only and fail-closed.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-graph\dependencyValidator.test.ts tests\unit\decision-graph\decisionRelationshipResolver.test.ts tests\unit\decision-graph\decisionGraphNodeBuilder.test.ts tests\unit\decision-graph\decisionGraphContractRoadmap.test.ts
```

Result: 4 files, 24 tests passed.
