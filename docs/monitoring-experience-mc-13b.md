# Phase MC-13B - Monitoring Experience

MC-13B turns MC-13A Production Monitoring Primitives into governed operator visibility. It exposes alert management, SLA monitoring, operational analytics, health reporting, an alert center, and a live operations dashboard while preserving the constitutional rule that monitoring is observational only.

## Constitutional Role

- Consumes MC-13A monitoring primitives plus qualified Mission Control sources from MC-1, MC-4, MC-5, MC-6, and MC-8.
- Provides operational visibility to MC-10 Operator Dashboard and MC-12 Operational Intelligence.
- Keeps every alert advisory: no alert can remediate, self-acknowledge, mutate runtime behavior, or bypass operator authority.
- Rejects synthetic or unqualified monitoring data.

## Service Contract

- `runMonitoringExperience(input)` returns deterministic monitoring experience outputs with replay and integrity hashes.
- `validateMonitoringExperience(result)` verifies aggregation, alerts, SLA, analytics, health reports, alert center, dashboard, evidence, and governance boundaries.
- `replayMonitoringExperience(result)` proves deterministic replay of the visibility outputs.
- `getMonitoringExperienceBundle()` publishes the MC-13B doctrine, result, and validation envelope.

## API Surface

All routes require an authenticated workspace member.

- `GET /api/monitoring-experience/contract`
- `POST /api/monitoring-experience/validate`
- `GET|POST /api/monitoring-experience/aggregator`
- `GET|POST /api/monitoring-experience/alerts`
- `GET|POST /api/monitoring-experience/sla`
- `GET|POST /api/monitoring-experience/analytics`
- `GET|POST /api/monitoring-experience/health`
- `GET|POST /api/monitoring-experience/alert-center`
- `GET|POST /api/monitoring-experience/dashboard`
- `GET|POST /api/monitoring-experience/evidence`
- `GET|POST /api/monitoring-experience/readiness`

## Qualification

MC-13B qualifies only when dashboards and reports represent governed operational state, alerts remain advisory-only, monitoring derives exclusively from qualified primitives, evidence is deterministic and replayable, and no monitoring capability can initiate execution or modify runtime state.
