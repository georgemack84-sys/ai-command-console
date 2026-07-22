# Phase 10.14.11 - Dashboard Observability

## Purpose

Phase 10.14.11 adds the observability layer for Adaptive Intelligence dashboards. It treats transparency as operational health: a dashboard that renders but omits lineage, replay, approval, certification, governance, rollback, security, or alert state is unhealthy.

## Implementation

- Added the `DashboardObservabilityRecord` contract and health, dimension, freshness, lineage, replay, reference, approval, certification, widget, alert, incident, and report taxonomies.
- Added a deterministic `dashboard-observability/v10.14.11` service with metrics, usage analytics, visibility validation, performance, freshness, lineage, replay, reference, approval, certification, widget, navigation, health, alert, incident, ledger, report, and console surfaces.
- Added read-only API routes for dashboard, contract, metrics, usage, visibility, performance, freshness, lineage, replay, references, approvals, certification, widgets, navigation, health, alerts, incidents, ledger, reports, console, validate, and inspect.
- Added certification tests for deterministic health evaluation, transparency completeness, read-only monitoring, visible observability degradation, immutable incidents and ledger, reports, fail-visible scenarios, and integrity tamper detection.

## Governance Rules

- Monitoring is read-only and advisory.
- Monitoring failures produce `OBSERVABILITY_DEGRADED` or `UNKNOWN`, never healthy.
- Health uses the most severe mandatory failure rather than an average.
- Critical alerts cannot auto-close and require verified restoration.
- Observability telemetry remains tenant-isolated and must not become a side channel for restricted dashboard information.

## Verification

- Focused unit coverage: `tests/unit/dashboard-observability/dashboardObservability.test.ts`
- Type coverage: `npm run typecheck`
