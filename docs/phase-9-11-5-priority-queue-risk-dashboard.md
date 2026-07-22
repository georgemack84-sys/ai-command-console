# Phase 9.11.5 - Priority Queue & Risk Dashboard

## Preview

The Priority Queue & Risk Dashboard provides deterministic operational visibility into decision priority, mission criticality, risk exposure, confidence, urgency, and queue health. It is advisory-only and derives from certified state, timeline, conflict, dependency, governance, replay, and audit evidence.

## Tightened Contract

- Queue ordering is deterministic and based only on mission priority, governance weighting, constitutional weighting, risk severity, confidence quality, urgency, dependency readiness, lifecycle state, and decision identity.
- Mission critical decisions, governance adjustments, certification blockers, replay references, and confidence lineage must remain visible.
- Risk, confidence, urgency, and analytics dashboards are projections of immutable decision state and conflict evidence, not mutation surfaces.
- The dashboard cannot reprioritize decisions, modify risk scores, alter governance outcomes, influence orchestration, or grant execution authority.
- Priority order mismatches, omitted mission-critical decisions, inaccurate risk, confidence mismatches, incorrect urgency indicators, inconsistent analytics, hidden governance adjustments, missing replay refs, hidden certification blockers, nondeterministic ordering, cross-tenant exposure, hash mismatches, replay reconstruction failure, authorization failure, and execution authority fail closed.

## Implementation

- Types: `types/decision-priority-risk-dashboard.ts`
- Service: `services/decision-priority-risk-dashboard/index.ts`
- Tests: `tests/unit/decision-priority-risk-dashboard/decisionPriorityRiskDashboard.test.ts`

The service provides deterministic queue items, queue records, mission-critical queue projection, risk dashboard, confidence dashboard, urgency visualization, queue analytics, replay validation, integrity validation, and fail-closed enforcement for Phase 9.11 priority and risk visibility.
