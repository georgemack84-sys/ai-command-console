# Phase 7K.1 Governance Dashboard

Phase 7K.1 implements the operator-facing Governance Dashboard for certified Governance Intelligence visibility.

## Scope

- Provides deterministic mission, tenant, and governance summaries.
- Displays recommendations, compliance, risk, escalations, historical trends, notifications, replay status, integrity status, and certification status.
- Uses certified Phase 7J outputs as the source of truth.
- Preserves read-only, advisory-only, tenant-isolated, replayable, and immutable-reference guarantees.
- Adds an operational page at `/governance-dashboard`.

## API Surface

- `GET /api/governance-dashboard/view`
- `GET /api/governance-dashboard/metadata`
- `GET /api/governance-dashboard/mission-summary`
- `GET /api/governance-dashboard/tenant-summary`
- `GET /api/governance-dashboard/governance-summary`
- `GET /api/governance-dashboard/recommendations`
- `GET /api/governance-dashboard/compliance`
- `GET /api/governance-dashboard/risks`
- `GET /api/governance-dashboard/escalations`
- `GET /api/governance-dashboard/historical-trends`
- `GET /api/governance-dashboard/notifications`
- `GET /api/governance-dashboard/replay-status`
- `GET /api/governance-dashboard/certification-status`
- `GET /api/governance-dashboard/hash`

## Guardrails

The dashboard cannot modify policies, approve recommendations, execute recommendations, override governance, alter replay state, or modify integrity state. It is strictly observational.

## Certification Notes

Dashboard hashes and widget hashes are canonical and deterministic. Identical certified inputs produce identical dashboard views, widget ordering, and hashes.
