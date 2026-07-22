# Phase 8ALT.4.6 - Health Explainability Engine

The Health Explainability Engine explains why Mission Health changed by comparing the latest Mission Health Timeline entry with its prior entry. It decomposes score movement, attributes subsystem and metric changes, traces evidence, explains confidence, connects trend influence, builds deterministic dependency graphs and causal chains, and produces an operator-facing report.

## Implemented Scope

- Timeline-first explanation derived from `buildMissionHealthTimeline()`.
- Score decomposition with weighted impact, confidence, readiness, stability, trend, and degradation effects.
- Deterministic subsystem attribution, metric deltas, evidence trace, confidence assessment, trend influence, dependency graph, causal explanation, and operator report.
- Replay and validation for reproducible deltas, deterministic attribution, evidence completeness, lineage, replay, integrity, governance, authority, tenant isolation, and advisory-only behavior.
- Authenticated read-model APIs under `/api/health-explainability-engine/*`.

## API Surface

- `GET /api/health-explainability-engine/contract`
- `POST /api/health-explainability-engine/explain`
- `POST /api/health-explainability-engine/score-decomposition`
- `POST /api/health-explainability-engine/attribution`
- `POST /api/health-explainability-engine/metric-changes`
- `POST /api/health-explainability-engine/confidence`
- `POST /api/health-explainability-engine/trend-influence`
- `POST /api/health-explainability-engine/evidence-trace`
- `POST /api/health-explainability-engine/dependency-graph`
- `POST /api/health-explainability-engine/causal-chain`
- `POST /api/health-explainability-engine/operator-report`
- `POST /api/health-explainability-engine/replay`
- `POST /api/health-explainability-engine/validate`
- `GET|POST /api/health-explainability-engine/inspect`

## Certification Notes

- Explanations are read-only derived artifacts.
- The engine never modifies mission health scores, evidence, timelines, governance, authority, or recovery state.
- Negative certification scenarios are represented in output and rejected by validation.
