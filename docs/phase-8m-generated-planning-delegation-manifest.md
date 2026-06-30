# Phase 8M.13 Generated Planning And Delegation Manifest

Status: planned, not staged

## Scope

Planning covers objective decomposition, dependency analysis, planning optimization, alternative planning, contingency planning, workflow, task sequencing, scheduling, execution, checkpoint, rollback preparation, and orchestration families.

Delegation covers delegation contract, task classification, authority validation, routing, orchestration lookup, and delegation certification families.

## Included Paths

Planning:

- `app/api/objective-*`
- `app/api/dependency-*`
- `app/api/planning-*`
- `app/api/alternative-planning/`
- `app/api/contingency-planning/`
- `app/api/workflow-*`
- `app/api/task-sequencing/`
- `app/api/execution-*`
- matching `services/*`, `tests/unit/*`, `types/*`, and generated docs

Delegation:

- `app/api/delegation-*`
- `app/api/authority-validation-engine/`
- `app/api/task-classification-engine/`
- matching `services/*`, `tests/unit/*`, `types/*`, and generated docs

Estimated generated entries:

- Planning: 83
- Delegation: 30

## Excluded Paths

Mission Control, Governance, Runtime, Recommendation, Recovery, Replay, Certification, and Shared Contracts.

## Domain Owner

Planning/orchestration owner and delegation authority owner.

## Risk Level

High.

## Dependencies

Authority validation, execution assurance, runtime supervision, rollback preparation, and certification gates.

## Validation Commands

- `npm run typecheck`
- `npx vitest run --config vitest.config.mjs tests/unit/objective-* tests/unit/dependency-* tests/unit/planning-* tests/unit/delegation-* tests/unit/task-* tests/unit/execution-* tests/unit/orchestration-* --reporter dot`
- `node scripts/phase-8m-quality-gate.cjs --classify`

## Merge Recommendation

Split into separate Planning and Delegation commits despite this combined planning manifest.

## Phase 8M.16 Delegation Split

Delegation is being split from Planning into its own generated-domain baseline commit.

Delegation included paths:

- `app/api/authority-validation-engine/`
- `app/api/delegation-certification-gate/`
- `app/api/delegation-contract/`
- `app/api/delegation-orchestration-lookup/`
- `app/api/delegation-routing-engine/`
- `app/api/task-classification-engine/`
- matching `services/*`, `tests/unit/*`, `types/*`, and generated docs listed in `docs/phase-8m-generated-delegation-inventory.md`

Planning remains excluded and uncommitted.

## Commit Readiness

Delegation commit-ready for Phase 8M.16. Planning remains not ready.
