# Phase 3.7 Observability and Operational Diagnostics Intake

Status: intake ready

## Objective

Phase 3.7 should improve operational diagnostics and observability confidence without changing runtime semantics, queue behavior, worker behavior, authentication, continuity validation, or governance enforcement.

This phase starts from the Phase 3.6 certified production state and treats observability as an evidence layer over the system, not a mutation path.

## Repository Findings

Existing production and diagnostic surfaces:

- `/api/ready` reports production readiness, auth/database/job posture, runtime warnings, and queue health.
- `/api/health` reports live health, database status, runtime warnings, and queue health.
- `/api/v1/observability/health` exposes authenticated, tenant-scoped contract-backed observability health.
- `/api/v1/observability/metrics` exposes authenticated, tenant-scoped contract-backed observability metrics.
- `/api/v1/observability/alerts` evaluates authenticated, tenant-scoped observability alerts.
- `services/observability/*` already contains metric snapshots, health aggregation, alert rules, alert evaluation, structured logging, replay metrics, and telemetry adapters.
- `services/startup/*` already contains startup governance, startup telemetry, continuity validation, and structured startup observations.
- `src/server/observability/*` already contains app runtime diagnostics, trace IDs, logging, analytics, and Sentry/PostHog integration points.

Existing tests already cover:

- observability health aggregation;
- observability API routes;
- observability metrics;
- observability alert rules and deduplication;
- structured logging;
- tenant observability boundaries;
- startup observability.

## Risks / Unknowns

- `/api/ready` and `/api/health` expose live runtime posture while `/api/v1/observability/*` exposes contract-backed observability snapshots. Phase 3.7 must avoid creating contradictory truth surfaces.
- Observability APIs are authenticated and tenant scoped; health/readiness endpoints are operational runtime endpoints. Their contracts should be documented as distinct instead of merged casually.
- Metric snapshots currently include timestamp-derived IDs. Deterministic testing must control `generatedAt`.
- Some observability sources may degrade by design when execution-specific context is absent. This should be explained, not treated as failure by default.
- Additional telemetry must not write hidden state or create production monitoring infrastructure unless explicitly scoped.

## Implementation Plan

Initial safe slice:

1. Document runtime truth boundaries between readiness, health, and observability APIs.
2. Add or tighten tests proving health/readiness and observability snapshots remain consistent but not identical.
3. Add deterministic contract tests for generated timestamps, health aggregation, and alert evaluation.
4. Add diagnostic reason fields only if they improve truthfulness without weakening status classification.
5. Avoid new monitoring infrastructure until gaps are proven by tests or runtime evidence.

## Files To Create / Modify

Expected first-slice files:

- `docs/phase-3.7-observability-diagnostics-intake.md`
- `tests/unit/observability-*.test.ts` only if additional boundary tests are needed
- `services/observability/*` only if tests expose a real contract gap
- `app/api/v1/observability/*` only if response contract validation is inconsistent

Forbidden first-slice changes:

- auth behavior
- queue semantics
- worker behavior
- continuity validation
- managed environment validation
- runtime execution logic
- governance semantics
- `/console` optimization

## Contracts

Phase 3.7 must preserve:

- readiness and health fail-closed behavior;
- tenant-scoped observability API authorization;
- outbound contract validation for observability APIs;
- deterministic health aggregation under controlled inputs;
- alert evaluation strength;
- startup governance and continuity validation.

## Tests First

Recommended test additions before implementation:

- readiness/health truth-boundary tests;
- observability snapshot determinism with fixed `generatedAt`;
- observability alert rule preservation for unhealthy/degraded states;
- tenant boundary tests for observability routes;
- startup observation redaction and structured log tests if startup diagnostics are extended.

## Validation Checklist

[ ] deterministic
[ ] replay safe
[ ] governance compliant
[ ] backward compatible
[ ] no hidden mutation
[ ] tests added where behavior is touched
[ ] fail-closed behavior verified
[ ] tenant scope preserved
[ ] no runtime semantics changed

## Final Risk Assessment

LOW

Reason: the first Phase 3.7 move is documentation and boundary classification only. Runtime changes should remain blocked until a concrete observability contract gap is proven by tests or production evidence.
