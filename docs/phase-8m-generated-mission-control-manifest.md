# Phase 8M.13 Generated Mission Control Manifest

Status: verified for generated-domain baseline commit

## Scope

Mission Control generated expansion covers visibility contract, operational dashboard, graph visualization, replay investigation workspace, and visibility certification gate families.

## Included Paths

- `app/api/mission-control-graph-visualization-engine/`
- `app/api/mission-control-operational-dashboard/`
- `app/api/mission-control-replay-investigation-workspace/`
- `app/api/mission-control-visibility-certification-gate/`
- `app/api/mission-control-visibility-contract/`
- `docs/phase-8j-1-mission-control-visibility-contract.md`
- `docs/phase-8j-2-mission-control-operational-dashboard.md`
- `docs/phase-8j-3-mission-control-graph-visualization-engine.md`
- `docs/phase-8j-4-mission-control-replay-investigation-workspace.md`
- `docs/phase-8j-5-mission-control-visibility-certification-gate.md`
- `services/mission-control-graph-visualization-engine/`
- `services/mission-control-operational-dashboard/`
- `services/mission-control-replay-investigation-workspace/`
- `services/mission-control-visibility-certification-gate/`
- `services/mission-control-visibility-contract/`
- `tests/unit/mission-control-graph-visualization-engine/`
- `tests/unit/mission-control-operational-dashboard/`
- `tests/unit/mission-control-replay-investigation-workspace/`
- `tests/unit/mission-control-visibility-certification-gate/`
- `tests/unit/mission-control-visibility-contract/`
- `tests/unit/mission-control/`
- `types/mission-control-graph-visualization-engine.ts`
- `types/mission-control-operational-dashboard.ts`
- `types/mission-control-replay-investigation-workspace.ts`
- `types/mission-control-visibility-certification-gate.ts`
- `types/mission-control-visibility-contract.ts`

Estimated generated entries: 25.

## Excluded Paths

- 825 other generated entries.
- 26 source changes.
- 9 non-generated documentation entries.
- 1 non-generated test repair.
- 4 Phase 8M leftovers.

## Domain Owner

Mission Control visibility/replay owner.

## Risk Level

High.

## Dependencies

Replay investigation, governance visibility, truth/ledger evidence, certification gate semantics, and API route behavior.

## Validation Commands

- `npx vitest run --config vitest.config.mjs tests/unit/mission-control-graph-visualization-engine tests/unit/mission-control-operational-dashboard tests/unit/mission-control-replay-investigation-workspace tests/unit/mission-control-visibility-certification-gate tests/unit/mission-control-visibility-contract --reporter dot`
- `npm run typecheck`
- `node scripts/phase-8m-quality-gate.cjs --classify`

## Validation Result

- Mission Control targeted Vitest: PASS, 64 files and 1413 tests.
- TypeScript: PASS.
- Classifier: PASS as script.

## Merge Recommendation

Candidate first generated-domain commit after staged-diff verification.

## Commit Readiness

Commit-ready. Commit only this manifest's included paths plus required Phase 8M.14 evidence/report updates. Do not include other generated domains.
