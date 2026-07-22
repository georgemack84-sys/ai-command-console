# Mission Control Phase 9.3.9 - Context Completeness & Gap Analysis Engine

Phase 9.3.9 adds the deterministic readiness gate for contextualized decisions before
orchestration.

## Scope

The engine:

- consumes Phase 9.3.1 through 9.3.8 context packages;
- assembles the certified decision context from all mandatory domains;
- scores mission, tenant, authority, evidence, dependency, risk, confidence, governance,
  constitutional, runtime, recovery, forecast, historical, and replay completeness;
- records missing, conflicting, stale, authority, governance, replay, and evidence gaps;
- produces advisory-only gap resolution recommendations;
- fails closed for missing mandatory context, replay gaps, governance or constitutional
  incompleteness, authority gaps, cross-tenant context, and integrity failure.

## Public API

`createContextCompletenessGapRequest(overrides?)`

Creates a replayable request with the candidate, full decision context, all upstream context
packages, and engine version.

`assessContextCompleteness(request?)`

Returns a `ContextCompletenessGapPackage` containing:

- domain scores
- weighted completeness result
- missing context registry
- advisory recommendations
- validation result
- explainability
- replay reference
- package integrity hash

`replayContextCompleteness(package)`

Recomputes the package hash and reports whether the completeness assessment can be replayed
exactly.

`buildContextCompletenessObservability(packages)`

Aggregates assessment attempts, successes, failures, average completeness, failure classes,
and replay success rate.

`getContextCompletenessGapEngine()`

Returns engine version, domain order, immutable weights, default request, default assessment,
replay result, and observability snapshot.

## Scoring

Weights are immutable for `context-completeness-gap-engine/v1` and follow the prompt:
mission 10%, tenant 5%, authority 10%, evidence 15%, dependency 10%, risk 10%, confidence
5%, governance 10%, constitutional 10%, runtime 5%, recovery 2.5%, forecast 2.5%,
historical 2.5%, replay 2.5%.

## Readiness

- `READY_FOR_ORCHESTRATION`: all mandatory context passes.
- `REQUIRES_CONTEXT_COMPLETION`: gaps exist but context is partially complete.
- `BLOCK_ORCHESTRATION`: low completeness with gaps.
- `FAIL_CLOSED`: tenant isolation or integrity failure.

Recommendations are advisory only and never execute remediation.
