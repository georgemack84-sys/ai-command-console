# Phase 12.6 - Forecast Intelligence

Phase 12.6 establishes deterministic, evidence-backed, policy-governed forecast artifacts for candidate strategies evaluated under registered scenarios. The implementation lives in `services/forecast-intelligence` and consumes Phase 12.5 Scenario Intelligence as its source of scenario, strategy, evidence, policy, and cycle lineage.

## Implemented Capabilities

- Canonical immutable `ForecastArtifact` schema with deterministic identity, one strategy, one scenario, one recommendation cycle, one model version, evidence refs, assumptions, policy manifest ref, authority ref, confidence, uncertainty, lifecycle, and integrity hash.
- Forecast model registry with immutable version binding, governance approval, certification status, supported variables, horizons, and scenario classes.
- Forecast input validation for strategy, scenario, assumptions, evidence, variables, temporal scope, policy, governance, authority, and cycle references.
- Explicit uncertainty report that separates confidence from uncertainty and records contributors plus sensitivity ranking.
- Immutable calibration report with reliability score and accuracy metrics.
- Preserved failure records for failed or indeterminate forecasts.
- Deterministic replay report, forecast registry, append-only ledger, observability report, and certification suite.

## API Surface

- `GET /api/forecast-intelligence/contract`
- `GET|POST /api/forecast-intelligence/generate`
- `GET|POST /api/forecast-intelligence/registry`
- `GET|POST /api/forecast-intelligence/models`
- `GET|POST /api/forecast-intelligence/validation`
- `GET|POST /api/forecast-intelligence/uncertainty`
- `GET|POST /api/forecast-intelligence/calibration`
- `GET|POST /api/forecast-intelligence/failures`
- `GET|POST /api/forecast-intelligence/replay`
- `GET|POST /api/forecast-intelligence/ledger`
- `GET|POST /api/forecast-intelligence/certification`
- `POST /api/forecast-intelligence/validate`
- `GET|POST /api/forecast-intelligence/observability`

## Certification Gate

The certification suite passes only when forecasts are deterministic, strategy/scenario-bound, model-bound to immutable certified versions, input-validated, evidence-backed, governance-approved, tenant-isolated, advisory-only, calibrated immutably, explicit about uncertainty, failure-preserving, replayable, ledgered append-only, observable, and integrity-valid.
