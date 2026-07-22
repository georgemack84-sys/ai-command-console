# Phase 8ALT.10.9 - Constitutional Assurance Dashboard

The Constitutional Assurance Dashboard is a deterministic read-only aggregation layer for constitutional monitoring, violation detection, resilience assessment, recommendations, replay validation, and learning validation.

It produces dashboard snapshots, panels, role-based views, metric explanations, and append-only dashboard ledger records. It never changes mission execution, policy, governance decisions, authority assignments, or autonomous behavior.

## Panels

- Constitutional Score
- Authority Status
- Governance Status
- Operator Authority
- Learning Compliance
- Optimization Compliance
- Runtime Health
- Violation Timeline
- Confidence History
- Replay Integrity
- System Resilience
- Recommendation Panel

## Role Views

- Executive
- Operator
- Governance
- Audit
- Certification
- Historical

## API

- `GET /api/constitutional-assurance-dashboard/dashboard`
- `POST /api/constitutional-assurance-dashboard/dashboard`
- `POST /api/constitutional-assurance-dashboard/panels`
- `POST /api/constitutional-assurance-dashboard/views`
- `POST /api/constitutional-assurance-dashboard/explanations`
- `POST /api/constitutional-assurance-dashboard/ledger`
- `POST /api/constitutional-assurance-dashboard/validate`
- `GET|POST /api/constitutional-assurance-dashboard/inspect`
