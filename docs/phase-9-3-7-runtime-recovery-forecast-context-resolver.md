# Mission Control Phase 9.3.7 - Runtime, Recovery & Forecast Context Resolver

Phase 9.3.7 adds deterministic operational awareness for `runtime_context`,
`recovery_context`, and `forecast_context` before orchestration.

## Scope

The resolver:

- resolves certified runtime telemetry, health, stability, resources, capacity, alerts, and constraints;
- evaluates recovery readiness, rollback capability, recovery dependencies, continuity status, and recovery confidence;
- generates advisory forecast impact, projected mission effects, downstream dependencies, projected risks, and recovery effects;
- consumes Phase 9.3.1 through 9.3.6 context packages;
- preserves runtime, recovery, and forecast lineage;
- fails closed for incomplete telemetry, recovery, forecast, replay, tenant isolation, or integrity state.

## Public API

`createRuntimeRecoveryForecastContextRequest(overrides?)`

Creates a replayable request containing the decision candidate, base context, mission and
tenant package, authority and operator package, evidence and dependency package, risk and
confidence package, governance and constitutional package, and resolver version.

`resolveRuntimeRecoveryForecastContext(request?)`

Returns a `RuntimeRecoveryForecastContextPackage` containing:

- `runtime_context`
- `recovery_context`
- `forecast_context`
- `runtime_domain`
- `recovery_domain`
- `forecast_domain`
- validation status and failure reasons
- replay reference
- package integrity hash

`replayRuntimeRecoveryForecastContext(package)`

Recomputes the package hash and reports whether runtime, recovery, and forecast context can
be replayed exactly.

`buildRuntimeRecoveryForecastObservability(packages)`

Aggregates resolution attempts, success and failure counts, runtime failures, recovery
failures, forecast failures, isolation failures, integrity failures, average operational
capacity, average forecast confidence, and replay success rate.

`getRuntimeRecoveryForecastContextResolver()`

Returns resolver order, telemetry registry, recovery registry, forecast registry, default
request, default package, replay result, and observability snapshot.

## Fail-Closed Conditions

The resolver reports `FAIL` when any of the following occur:

- runtime telemetry is unavailable;
- runtime health, system stability, or resource availability cannot be resolved;
- recovery readiness or rollback capability is unresolved;
- forecast engine output is unavailable;
- future mission effects, downstream dependencies, or projected risks cannot be determined;
- lineage is incomplete;
- upstream replay is incompatible;
- cross-tenant operational references are detected;
- upstream integrity validation fails.

## Context Contract Integration

Successful packages expose `runtime_domain`, `recovery_domain`, and `forecast_domain` values
compatible with `createDecisionContext({ domain_overrides })`, allowing Phase 9.3.1 decision
contexts to be patched with certified operational state before downstream historical lineage
and replay context resolution.
