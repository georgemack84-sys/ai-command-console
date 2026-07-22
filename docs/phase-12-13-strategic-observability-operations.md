# Phase 12.13 - Observability and Operations

Phase 12.13 adds the read-only operational control plane for Phase 12 Strategic Recommendation Intelligence. It provides deterministic dashboards, lifecycle monitoring, artifact health, policy manifest health, performance telemetry, observation monitoring, replay and integrity visibility, governance operations, tenant operations, derived-view consistency, alerting, and validated operational runbooks.

## Service

`services/strategic-observability-operations` exposes:

- `runStrategicObservabilityOperations(input?)`
- `validateStrategicObservabilityOperations(result?)`
- `replayStrategicObservabilityOperations(result?)`
- `getStrategicObservabilityOperationsContract()`

The module consumes Phase 12.12 governance enforcement and never mutates recommendation artifacts. All dashboards and alerts remain advisory-only, tenant-isolated, replayable, and hash-bound.

## API

Authenticated workspace members can inspect:

- `GET /api/strategic-observability-operations/contract`
- `GET|POST /api/strategic-observability-operations/dashboard`
- `GET|POST /api/strategic-observability-operations/cycles`
- `GET|POST /api/strategic-observability-operations/artifacts`
- `GET|POST /api/strategic-observability-operations/manifests`
- `GET|POST /api/strategic-observability-operations/performance`
- `GET|POST /api/strategic-observability-operations/observations`
- `GET|POST /api/strategic-observability-operations/replay-integrity`
- `GET|POST /api/strategic-observability-operations/governance`
- `GET|POST /api/strategic-observability-operations/tenant`
- `GET|POST /api/strategic-observability-operations/derived-views`
- `GET|POST /api/strategic-observability-operations/alerts`
- `GET|POST /api/strategic-observability-operations/runbooks`
- `GET|POST /api/strategic-observability-operations/certification`
- `POST /api/strategic-observability-operations/validate`

POST requests may provide either a full `result` or a scenario such as `CYCLE_STALLED_UNDETECTED`, `REPLAY_FAILURE_HIDDEN`, `TENANT_VIOLATION_HIDDEN`, or `RUNBOOK_INVALID`.

## Certification

The certification suite verifies dashboard accuracy, role visibility, stalled and blocked cycle detection, artifact and manifest anomaly visibility, performance bottleneck visibility, observation monitoring, replay and integrity visibility, governance backlog metrics, tenant isolation visibility, derived-view consistency, deterministic alerting, validated runbooks, and advisory-only behavior.
