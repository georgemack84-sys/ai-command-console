# Phase 9.11.8 - Operator Activity Dashboard

## Preview

Phase 9.11.8 adds the read-only dashboard for operator responsibilities, workload, approvals, overrides, escalations, history, and activity evidence. It consumes Phase 9.11.7 replay and certification monitoring so operator activity remains replayable, certification-aware, governance-aware, and tenant-isolated.

## Tightened Contract

The implementation exposes:

- `OperatorWorkQueue` for assigned decisions, deterministic queue order, queue categories, workload metrics, pending actions, and replay refs.
- `OperatorApprovalDashboard` for pending, completed, rejected, delegated, expired approvals, approval history, latency, and replay refs.
- `OperatorOverrideDashboard` for override refs, override categories, original recommendations, justifications, governance refs, replay refs, and certification impact.
- `OperatorEscalationDashboard` for escalation refs, types, status, assigned authority, deadlines, resolution history, and replay refs.
- `OperatorHistoryViewer` for chronological activity refs, timeline refs, workload history, and replay refs.
- `OperatorActivityLedgerEntry` and `OperatorActionRecord` for immutable operator activity evidence.
- `OperatorActivityRecord` as the deterministic join record across all rendered views.

The dashboard is observational only. It cannot modify assignments, approve recommendations, execute actions, bypass governance, conceal overrides, or suppress escalations.

## Fail-Closed Validation

Dashboard certification is blocked when:

- operator work queues are incomplete
- approval history is missing
- overrides are hidden
- escalation activity is omitted
- operator history cannot be reconstructed
- workload metrics are inaccurate
- authority assignments are inconsistent
- replay references are missing
- certification references are absent
- dashboard ordering is nondeterministic
- cross-tenant operator data is exposed
- integrity hashes fail validation
- replay cannot reconstruct identical operator activity
- the requesting role lacks visibility
- execution authority is granted by the dashboard

## Implementation

- Types: `types/decision-operator-activity-dashboard.ts`
- Service: `services/decision-operator-activity-dashboard/index.ts`
- Tests: `tests/unit/decision-operator-activity-dashboard/decisionOperatorActivityDashboard.test.ts`

Primary API:

- `runOperatorActivityDashboard(input?)`
- `replayOperatorActivityDashboard(result)`
- `computeOperatorActionRecordHash(record)`
- `getOperatorActivityDashboardFoundation()`
- `OperatorActivityDashboard.run(...)`
- `OperatorActivityDashboard.replay(...)`
