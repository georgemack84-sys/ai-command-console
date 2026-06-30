# Phase 8M Bundle C - Source Change Manifest

Status: separate review bundle

## Purpose

Bundle C inventories remaining source changes that are not part of Bundle A stabilization and should not be mixed with generated phase expansion.

## Current Source Change Classification

Current classifier count:

- Source Changes: 26.

Known modified tracked source/infrastructure files:

| Path | Classification | Review Need |
| --- | --- | --- |
| `app/globals.css` | Source Changes | Needs UI/style review. |
| `app/layout.tsx` | Source Changes | Needs app shell/runtime review. |
| `next.config.ts` | Source Changes | Infrastructure; needs build review. |

Known generated-like or active development source surfaces classified for source review:

- `services/autonomous-execution-reconstruction/`
- `services/checkpoint-manager/`
- `services/decision-graph/`
- `services/decision-influence-analysis/`
- `services/dependency-analysis/`
- `services/dependency-scheduler/`
- `services/drift-health-intelligence/`
- `services/escalation-detection/`
- `services/escalation-intelligence/`
- `services/escalation-prioritization/`
- `services/execution-monitor/`
- `services/ledger-explorer/`
- `services/mission-control-operational-dashboard/`
- `services/mission-control/`
- `services/objective-decomposition/`
- `services/plan-execution-lookup/`
- `services/rollback-preparation/`
- `services/strategic-readiness/`
- `services/violation-patterns/`
- `src/core/`
- `src/edgebook/`
- `src/index.ts`
- `src/modules/`

## File Classifications

- Phase 8M required: none beyond Bundle A.
- Active development: service and `src/` surfaces pending owner review.
- Infrastructure: `next.config.ts`.
- Shared library: `src/core/`, `src/modules/`, `src/edgebook/`.
- Needs review: all Bundle C entries.
- Archive candidate: none identified from source changes.

## Validation Required

Before Bundle C can merge:

- TypeScript PASS.
- Lint PASS.
- Production build PASS.
- Affected service-family tests PASS.
- UI/app shell smoke validation for `app/globals.css` and `app/layout.tsx`.
- Build output validation for `next.config.ts`.

## Review Strategy

Bundle C should be reviewed after Bundle A and before generated expansion is accepted into release scope. Any generated-like service directories in Bundle C should either move to Bundle B or receive explicit active-development ownership.

