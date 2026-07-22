# Phase 9.11.2 - Decision State Dashboard

## Preview

The Decision State Dashboard provides the authoritative operational state model for decisions moving through orchestration. It is a deterministic, replayable dashboard data layer for active decisions, blockers, escalations, deferred work, operator queues, lifecycle progression, and dashboard metrics.

## Tightened Contract

- The Decision State Registry is the single source of truth for dashboard state and must stay synchronized with orchestration lifecycle state.
- Active, blocked, escalation, deferred, and operator queue dashboards are projections of the registry, not independent mutable stores.
- Dashboard metrics cover operational state, governance state, operator workload, replay readiness, certification progress, and readiness score.
- Rendering is deterministic through stable priority, timestamp, and decision identity ordering.
- The dashboard is advisory-only and never modifies orchestration state, priorities, governance, certification, or operator actions.
- Missing active decisions, hidden blockers, inaccurate escalations, untracked deferrals, incomplete operator queues, state mismatches, invalid lifecycle transitions, hidden governance restrictions, replay inconsistencies, missing certification status, cross-tenant exposure, integrity mismatches, replay reconstruction failures, authorization failures, and execution authority all fail closed.

## Implementation

- Types: `types/decision-state-dashboard.ts`
- Service: `services/decision-state-dashboard/index.ts`
- Tests: `tests/unit/decision-state-dashboard/decisionStateDashboard.test.ts`

The service provides deterministic registry construction, dashboard projections, queue metrics, replay hashing, integrity validation, and fail-closed enforcement for Phase 9.11 operational decision visibility.
