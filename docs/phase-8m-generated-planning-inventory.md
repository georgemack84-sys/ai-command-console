# Phase 8M.23 Generated Planning Inventory

Status: inventoried and validated before staging

## Summary

- Candidate roots: 64.
- Candidate files: 151.
- API files: 99.
- Service files: 13.
- Unit test files: 13.
- Type files: 12.
- Generated documentation files: 14.

## Included Domain Families

- Objective decomposition.
- Dependency analysis.
- Alternative planning.
- Contingency planning.
- Workflow orchestration.
- Task sequencing.
- Dependency scheduling.
- Execution contract.
- Execution monitoring.
- Checkpoint management.
- Rollback preparation.
- Plan execution lookup.
- Orchestration certification hook.

## Included Paths

API roots:

- `app/api/alternative-planning/`
- `app/api/checkpoint-manager/`
- `app/api/contingency-planning/`
- `app/api/dependency-analysis/`
- `app/api/dependency-scheduler/`
- `app/api/execution-contract/`
- `app/api/execution-monitor/`
- `app/api/objective-decomposition/`
- `app/api/orchestration-certification-gate/`
- `app/api/plan-execution-lookup/`
- `app/api/task-sequencing/`
- `app/api/workflow-orchestrator/`

Service roots:

- `services/alternative-planning/`
- `services/checkpoint-manager/`
- `services/contingency-planning/`
- `services/dependency-analysis/`
- `services/dependency-scheduler/`
- `services/execution-contract/`
- `services/execution-monitor/`
- `services/objective-decomposition/`
- `services/orchestration-certification-gate/`
- `services/plan-execution-lookup/`
- `services/rollback-preparation/`
- `services/task-sequencing/`
- `services/workflow-orchestrator/`

Test roots:

- `tests/unit/alternative-planning/`
- `tests/unit/checkpoint-manager/`
- `tests/unit/contingency-planning/`
- `tests/unit/dependency-analysis/`
- `tests/unit/dependency-scheduler/`
- `tests/unit/execution-contract/`
- `tests/unit/execution-monitor/`
- `tests/unit/objective-decomposition/`
- `tests/unit/orchestration-certification-gate/`
- `tests/unit/plan-execution-lookup/`
- `tests/unit/rollback-preparation/`
- `tests/unit/task-sequencing/`
- `tests/unit/workflow-orchestrator/`

Type files:

- `types/alternative-planning.ts`
- `types/checkpoint-manager.ts`
- `types/contingency-planning.ts`
- `types/dependency-analysis.ts`
- `types/dependency-scheduler.ts`
- `types/execution-contract.ts`
- `types/execution-monitor.ts`
- `types/objective-decomposition.ts`
- `types/orchestration-certification-gate.ts`
- `types/plan-execution-lookup.ts`
- `types/task-sequencing.ts`
- `types/workflow-orchestrator.ts`

Generated docs:

- `docs/phase-8b-1-objective-decomposition-engine.md`
- `docs/phase-8b-2-dependency-analysis-engine.md`
- `docs/phase-8b-4-alternative-planning-engine.md`
- `docs/phase-8b-5-contingency-planning-engine.md`
- `docs/phase-8c-1-execution-contract.md`
- `docs/phase-8c-2-workflow-orchestrator.md`
- `docs/phase-8c-3-task-sequencing-engine.md`
- `docs/phase-8c-4-dependency-scheduler.md`
- `docs/phase-8c-5-execution-monitor.md`
- `docs/phase-8c-6-checkpoint-manager.md`
- `docs/phase-8c-7-rollback-preparation-engine.md`
- `docs/phase-8c-8-orchestration-certification-gate.md`
- `docs/phase-8i-3-plan-execution-lookup.md`
- `docs/phase-8m-generated-planning-delegation-manifest.md`

## Explicit Exclusions

- Certification generated domain outside the Planning-owned orchestration certification hook.
- Shared Contracts generated domain.
- Recovery planning documentation left over from the Recovery domain.
- Boundary certification and execution boundary families.
- Source changes.
- Unrelated documentation.
- Phase 8M stabilization leftovers.
- Test repair.
- Archive candidates and experimental files.

## Risk Level

High. Planning coordinates decomposition, dependency ordering, execution readiness, orchestration, rollback preparation, and plan execution lookup.

## Ownership Recommendation

Planning/orchestration owner with certification reviewer signoff for the Planning-owned orchestration certification hook.

## Validation Required

- Requested Planning wildcard Vitest command.
- Actual discovered Planning/orchestration Vitest suites.
- TypeScript.
- Phase 8M classifier.
- Staged-diff allowlist guard.
