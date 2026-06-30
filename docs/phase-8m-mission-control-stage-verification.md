# Phase 8M.14 Mission Control Stage Verification

Status: verified for commit

## Staged Files

The Mission Control generated-domain commit must include only:

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
- `docs/phase-8m-generated-mission-control-manifest.md`
- `docs/phase-8m-generated-phase-expansion-inventory.md`
- `docs/phase-8m-mission-control-stage-verification.md`
- `docs/phase-8m-validation-report.md`
- `docs/phase-8m-certification-assessment.md`
- `docs/phase-8m-remaining-blockers.md`
- `docs/phase-8m-repository-reconciliation-plan.md`
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

## Excluded Files

- Governance generated domain.
- Autonomy generated domain.
- Replay generated domain.
- Runtime generated domain.
- Recommendation generated domain.
- Truth Ledger generated domain.
- Recovery generated domain.
- Planning generated domain.
- Delegation generated domain.
- Certification generated domain.
- Shared Contracts generated domain.
- 26 source changes.
- Non-Mission-Control generated documentation.
- Archive candidates.
- Experimental work.

## Validation Results

- Mission Control targeted Vitest: PASS, 64 files and 1413 tests.
- `npm run typecheck`: PASS.
- `node scripts/phase-8m-quality-gate.cjs --classify`: PASS as script; certification remains FAIL.

## Diff Summary

Final cached-diff verification:

- Staged files: 140.
- Unexpected staged paths: 0.
- Diff stat: 140 files changed, 23373 insertions.
- Scope: Mission Control generated API routes, services, types, documentation, tests, generated inventory/manifest evidence, and Phase 8M.14 report updates.

## Commit Readiness

Commit-ready. The staged diff contains only Mission Control generated-domain paths and required Phase 8M.14 evidence/report updates.

## Remaining Generated Domains

- Governance
- Autonomy
- Replay
- Runtime
- Recommendation
- Truth Ledger
- Recovery
- Planning
- Delegation
- Certification
- Shared Contracts

## Certification State

FAIL. Certification remains blocked until all generated domains are reviewed, accepted domains are committed separately, rejected domains are archived or removed with evidence, source changes are reviewed, full unit suite passes, production build passes, and release validation succeeds.
