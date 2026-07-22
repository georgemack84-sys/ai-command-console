# Phase 9.10.9 - Replay Analytics & Explainability

## Preview

Replay Analytics & Explainability turns immutable replay, audit, integrity, governance, operator, divergence, and certification evidence into deterministic operational intelligence. It explains what happened and why without rewriting replay outcomes, modifying ledger history, or generating new decisions.

## Tightened Contract

- Analytics are derived only from immutable ledger evidence and are reproducible for the same inputs.
- The engine calculates replay success, replay duration, divergence frequency, governance statistics, operator statistics, decision reconstruction completeness, audit completeness, and integrity trends.
- Explanations cover replay match, replay divergence, replay confidence, governance replay, decision replay, and operator replay, with every explanation backed by immutable replay, governance, integrity, and evidence references.
- The dashboard model exposes replay summary, fidelity, duration, success rate, divergence analysis, governance status, operator activity, reconstruction coverage, integrity status, audit coverage, and certification readiness.
- Metrics, explanations, and dashboard snapshots are persisted as append-only metrics ledger records.
- Missing references, unsupported metric versions, incomplete explanations, incomplete dashboards, incomplete confidence, tenant boundary violations, ledger integrity failures, lineage gaps, unknown analytics states, non-read-only behavior, and non-reproducible metrics fail closed.

## Implementation

- Types: `types/decision-replay-analytics-explainability.ts`
- Service: `services/decision-replay-analytics-explainability/index.ts`
- Tests: `tests/unit/decision-replay-analytics-explainability/decisionReplayAnalyticsExplainability.test.ts`

The service provides deterministic metric calculation, evidence-backed explanations, operator dashboard construction, append-only replay metrics ledger entries, canonical hashing, and fail-closed analytics validation for Phase 9.10 replay intelligence.
