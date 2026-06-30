# Phase 8J.1 - Visibility Contract

## Purpose

Phase 8J.1 defines the canonical visibility contract for Mission Control dashboards, widgets, visualization records, access rules, replay references, lineage references, integrity requirements, and advisory-only behavior.

## Implementation

- `types/mission-control-visibility-contract.ts` defines visualization records, dashboard contracts, widget registry entries, visualization standards, access requirements, validation tests, reports, validation results, and observability surfaces.
- `services/mission-control-visibility-contract/index.ts` builds the six dashboard contracts, approved 20-widget registry, canonical visualization standards, tenant-safe access contract, visibility records, and certification-readiness validation tests.
- `app/api/mission-control-visibility-contract/*` exposes contract, report, validation, dashboards, widgets, and inspect endpoints.
- `tests/unit/mission-control-visibility-contract/missionControlVisibilityContract.test.ts` verifies dashboard/widget coverage, replay/lineage/integrity/evidence requirements, deterministic hashes, advisory-only behavior, and failure conditions.

## Dashboards

The contract defines execution, autonomy, governance, confidence, risk, and intervention dashboards. Each dashboard is read-only, replay-backed, lineage-backed, integrity-backed, and advisory-only.

## Widget Registry

The registry includes 20 approved widgets spanning execution timelines, state panels, governance panels, confidence trends, risk summaries, intervention timelines, replay references, integrity hashes, and evidence references. Every widget has `execution_authority: false`.

## Validation

The contract validates schema completeness, dashboard coverage, widget registry coverage, visualization standards, immutable IDs, timestamps, replay references, lineage references, integrity hashes, evidence references, deterministic ordering, tenant isolation, mutation rejection, hidden-state rejection, and stale-data handling.
