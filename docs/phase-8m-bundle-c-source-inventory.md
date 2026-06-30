# Phase 8M.26 Bundle C Source Inventory

Status: inventoried, not staged

## Summary

- Bundle C source entries by classifier: 14.
- Ready for immediate source commit: 3.
- Defer until residual generated disposition: 11.
- Source commit action in this phase: none.

## Source Inventory

| Path | Category | Owner | Intent classification | Recommended action | Ready for commit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `app/globals.css` | UI | App shell owner | Stabilization fix | Ready for commit | Yes | Adds local deterministic font fallback variables for sandbox-safe builds. |
| `app/layout.tsx` | UI | App shell owner | Stabilization fix | Ready for commit | Yes | Removes Google font dependency and uses local CSS variables/fallbacks. |
| `next.config.ts` | Build | Platform/build owner | Stabilization fix | Ready for commit | Yes | Disables persistent webpack filesystem cache for deterministic production builds outside dev. |
| `services/autonomous-execution-reconstruction/` | Service | Autonomy/recovery owner | Generated-like service expansion | Defer | No | Needs owner review; not tied to the accepted Shared Contracts bundle. |
| `services/decision-graph/` | Service | Governance intelligence owner | Generated-like service expansion | Defer | No | Has residual generated test dependency at `tests/unit/decision-graph/`. |
| `services/decision-influence-analysis/` | Service | Governance intelligence owner | Generated-like service expansion | Defer | No | Depends on residual API/type/test/doc artifacts. |
| `services/escalation-intelligence/` | Service | Escalation intelligence owner | Generated-like service expansion | Defer | No | Has residual generated test dependency. |
| `services/mission-control/` | Service | Mission Control owner | Generated-like service expansion | Defer | No | Large untracked service root needs Mission Control owner review. |
| `services/strategic-readiness/` | Service | Strategic readiness owner | Generated-like service expansion | Defer | No | Has residual generated test dependency. |
| `services/violation-patterns/` | Service | Governance risk owner | Generated-like service expansion | Defer | No | Depends on residual API/type/test/doc artifacts. |
| `src/core/` | Infrastructure | EdgeBook/platform owner | Generated-like shared foundation | Defer | No | Paired with EdgeBook tests and phase-1 documentation. |
| `src/edgebook/` | UI / Service | EdgeBook owner | Generated-like product surface | Defer | No | Paired with EdgeBook tests and phase-1 documentation. |
| `src/index.ts` | Tooling / Export surface | EdgeBook/platform owner | Generated-like export surface | Defer | No | Depends on `src/core` and `src/modules`. |
| `src/modules/` | Service / Infrastructure | EdgeBook owner | Generated-like domain modules | Defer | No | Paired with EdgeBook tests and phase-1 documentation. |

## Commit Sequencing Recommendation

1. Commit the three deterministic build/UI stabilization changes only after source validation: `app/globals.css`, `app/layout.tsx`, and `next.config.ts`.
2. Reclassify generated-like service roots into explicit residual generated bundles before staging.
3. Keep EdgeBook source roots out of Bundle C source commit until the EdgeBook docs/tests are dispositioned together.
4. Keep governance intelligence/risk source roots out of Bundle C source commit until their generated API/type/test/doc artifacts are accepted or rejected.
