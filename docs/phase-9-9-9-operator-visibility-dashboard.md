# Phase 9.9.9 - Operator Visibility Dashboard Model

## Preview

The Operator Visibility Dashboard Model is a read-only projection of immutable workflow audit and replay records. It provides deterministic visibility into workflow status, recommendation context, governance posture, operator activity, replay history, and timeline data without modifying workflow state or executing actions.

## Tightened Contract

- Dashboard rendering is deterministic and built only from recorded audit facts.
- The model includes workflow status, recommendation summary, governance summary, operator activity, replay summary, workflow timeline, full dashboard view model, and status API response.
- The status API is read-only and enforces tenant and operator authorization inputs.
- Governance and constitutional statuses cannot be hidden or suppressed.
- Timeline, evidence chain, and lineage chain are derived from immutable audit events.
- Missing workflow data, invalid state, incomplete recommendation, missing governance or constitutional status, incomplete replay history, inconsistent timeline, incomplete lineage, authorization failure, tenant mismatch, integrity tampering, read-only violation, or non-advisory behavior fails closed.

## Implementation

- Types: `types/operator-visibility-dashboard.ts`
- Service: `services/operator-visibility-dashboard/index.ts`
- Tests: `tests/unit/operator-visibility-dashboard/operatorVisibilityDashboard.test.ts`

The service integrates with Phase 9.9.8 Workflow Audit & Replay and exposes a deterministic dashboard foundation, status API model, replay output, and observability summary.
