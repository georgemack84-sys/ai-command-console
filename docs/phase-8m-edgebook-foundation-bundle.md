# Phase 8M.36 EdgeBook Foundation Bundle

## Scope

Phase 8M.36 isolates the EdgeBook foundation bundle as the final major residual-generated repair bundle before source-change reclassification.

Included scope:

- `src/core/**`
- `src/edgebook/**`
- `src/modules/**`
- `src/index.ts`
- `tests/unit/edgebook/**`
- `docs/phase-1-*`

## Included Files

The bundle contains EdgeBook core contracts, configuration, errors, events, guards, validation helpers, EdgeBook domain modules, module exports, Phase 1 documentation, and EdgeBook unit coverage.

Included path groups:

- `src/core/`
- `src/edgebook/`
- `src/modules/`
- `src/index.ts`
- `tests/unit/edgebook/`
- `docs/phase-1-0-core-system-skeleton.md`
- `docs/phase-1-1-source-registry.md`
- `docs/phase-1-2-market-observation-schema.md`
- `docs/phase-1-3-ownership-binding.md`
- `docs/phase-1-4-raw-observation-store.md`
- `docs/phase-1-5-verification-engine.md`
- `docs/phase-1-6-basic-change-detection.md`
- `docs/phase-1-7-responsible-gambling-guardrails.md`

## Excluded Files

Explicitly excluded from this commit:

- `src/tests/**`
- `docs/phase-6i-2-hash-chain-engine.md`
- `docs/phase-6j-2-search-engine.md`
- `services/autonomous-execution-reconstruction/**`
- `services/decision-graph/**`
- `services/escalation-intelligence/**`
- `services/mission-control/**`
- `services/signal-engine/**`
- `services/strategic-readiness/**`
- `tests/unit/decision-graph/**`
- `tests/unit/escalation-intelligence/**`
- `tests/unit/signal-engine/**`
- `tests/unit/strategic-readiness/**`

## Dependency Check

The EdgeBook tests import the EdgeBook foundation through `@/src/core`, `@/src/modules`, and the EdgeBook module surfaces included in this bundle.

No required dependency on unrelated generated services, non-EdgeBook source changes, or residual generated artifacts was identified.

`src/tests/**` contains only README placeholders for future fixtures, integration tests, and unit test structure. It does not contain executable EdgeBook test repair code and is not required by the staged EdgeBook unit suites.

## Risk

Risk level: medium.

The bundle introduces a foundation-level package surface under `src/` and a broad EdgeBook domain skeleton. The risk is bounded by staging only EdgeBook-owned paths and validating the dedicated EdgeBook unit suite, TypeScript, lint, and the Phase 8M classifier.

## Validation Plan

Required validation:

- `npx vitest run --config vitest.config.mjs tests/unit/edgebook --reporter dot`
- `npm run typecheck`
- `npm run lint`
- `node scripts/phase-8m-quality-gate.cjs --classify`

Additional EdgeBook-related suites: none discovered outside `tests/unit/edgebook`.

## Test Repair Disposition

Deferred.

`src/tests/**` remains unstaged because it contains only README scaffolding and is not executable EdgeBook test repair content. It should be resolved during a separate test repair or source-tree cleanup phase with explicit evidence.

## Commit Readiness

Ready if the stage guard confirms only EdgeBook foundation paths and required Phase 8M evidence updates are staged, EdgeBook unit tests pass, TypeScript passes, lint passes, and the Phase 8M classifier passes.
