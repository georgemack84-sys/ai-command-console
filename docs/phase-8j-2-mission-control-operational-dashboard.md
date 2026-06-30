# Phase 8J.2 - Operational Dashboard

## Purpose

Phase 8J.2 provides a deterministic, read-only Mission Control operational dashboard for autonomous mission awareness. It exposes execution progress, lifecycle state, governance posture, confidence, risk, supervision health, mission summary, alerts, and refresh metadata without granting execution authority.

## Implementation

- `types/mission-control-operational-dashboard.ts` defines timeline, state, governance, confidence, risk, supervision, summary, alert, refresh, validation, report, and observability contracts.
- `services/mission-control-operational-dashboard/index.ts` builds deterministic operational dashboard records and validates replay, lineage, integrity, tenant isolation, advisory-only behavior, and monitor completeness.
- `app/api/mission-control-operational-dashboard/*` exposes contract, dashboard, timeline, state, governance, confidence, risks, supervision, summary, alerts, refresh, and inspect endpoints.
- `tests/unit/mission-control-operational-dashboard/missionControlOperationalDashboard.test.ts` verifies certification-readiness requirements and failure conditions.

## Dashboard Sections

The dashboard includes an execution timeline, state monitor, governance panel, confidence monitor, risk monitor, supervision monitor, mission summary, alerts, and a refresh record. All displayed records preserve replay references, lineage references, and integrity hashes.

## Refresh Modes

Supported refresh modes are `REAL_TIME`, `EVENT_DRIVEN`, `REPLAY_MODE`, and `SNAPSHOT_MODE`. Replay and snapshot modes freeze the dashboard at deterministic historical timestamps and mark snapshots immutable.

## Read-Only Guarantees

The operational dashboard never executes actions, approves execution, modifies missions, alters replay history, bypasses governance, exposes cross-tenant data, or grants execution authority.
