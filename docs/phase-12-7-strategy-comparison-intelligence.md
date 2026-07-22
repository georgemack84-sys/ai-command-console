# Phase 12.7 - Strategy Comparison Intelligence

Phase 12.7 establishes deterministic comparison intelligence for evaluating qualified candidate strategies under a single immutable policy set. The implementation lives in `services/strategy-comparison-intelligence` and consumes Phase 12.6 Forecast Intelligence as its strategy, evidence, confidence, uncertainty, and replay lineage source.

## Implemented Capabilities

- Canonical `StrategyComparisonArtifact` with deterministic identity, policy manifest reference, dimensions, thresholds, tie policy, scores, ranking, outcome, evidence, authority, governance, lifecycle, replay refs, and integrity hash.
- Eligibility validation for qualified strategies, policy compatibility, governance, constitutional eligibility, evidence, authority, scenario, forecast, and portfolio compatibility.
- Registered 20-dimension comparison evaluation with deterministic normalization and weighted scoring.
- Immutable threshold evaluation for confidence, uncertainty, risk, evidence, governance, constitutional compliance, resources, and replay qualification.
- Deterministic tie resolution with policy-bound rationale.
- Supersession control that blocks post-recommendation mutation and preserves lineage.
- Replay report, explainability report, append-only ledger, artifact registry, observability report, and certification suite.

## API Surface

- `GET /api/strategy-comparison-intelligence/contract`
- `GET|POST /api/strategy-comparison-intelligence/create`
- `GET|POST /api/strategy-comparison-intelligence/eligibility`
- `GET|POST /api/strategy-comparison-intelligence/dimensions`
- `GET|POST /api/strategy-comparison-intelligence/thresholds`
- `GET|POST /api/strategy-comparison-intelligence/ties`
- `GET|POST /api/strategy-comparison-intelligence/complete`
- `GET|POST /api/strategy-comparison-intelligence/supersession`
- `GET|POST /api/strategy-comparison-intelligence/replay`
- `GET|POST /api/strategy-comparison-intelligence/explain`
- `GET|POST /api/strategy-comparison-intelligence/ledger`
- `GET|POST /api/strategy-comparison-intelligence/certification`
- `POST /api/strategy-comparison-intelligence/validate`
- `GET|POST /api/strategy-comparison-intelligence/observability`

## Certification Gate

The certification suite passes only when eligibility is deterministic, dimensions are registered, scoring is reproducible, thresholds are immutable and deterministic, ties are resolved without randomness, completion is reproducible, supersession is controlled, replay reproduces identical rankings and outputs, explainability is complete, governance is enforced, tenant isolation holds, and the comparison ledger is append-only.
