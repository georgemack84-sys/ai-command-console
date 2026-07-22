# Phase 12.8 - Portfolio Assessment Intelligence

Phase 12.8 evaluates collections of candidate strategies as deterministic portfolios, measuring combined effects, dependencies, resource demands, risks, resilience, scenario behavior, comparisons, and advisory outputs. The implementation lives in `services/portfolio-assessment-intelligence` and consumes Phase 12.7 Strategy Comparison Intelligence as its membership and evidence source.

## Implemented Capabilities

- Canonical `PortfolioAssessmentArtifact` with deterministic identity, immutable membership, dependency graph, resource analysis, scenario refs, aggregate risk, scores, advisory recommendation, policy manifest ref, authority ref, replay ref, and integrity hash.
- Immutable portfolio membership with fixed strategy versions, duplicate prevention, qualification preservation, and lineage validation.
- Cross-strategy dependency graph, failure propagation, and critical path report.
- Resource demand matrix, conflict report, capacity validation, and resolution candidates.
- Aggregate and systemic risk assessment with correlation and mitigation references.
- Multi-scenario portfolio assessment with robustness, resilience, sensitivity, and outcome matrix references.
- Deterministic alternative portfolio comparison with thresholds and tie resolution.
- Advisory-only portfolio recommendation package with rationale, tradeoffs, strengths, weaknesses, risk, resource, confidence, and uncertainty summaries.
- Replay report, append-only ledger, observability report, and certification suite.

## API Surface

- `GET /api/portfolio-assessment-intelligence/contract`
- `GET|POST /api/portfolio-assessment-intelligence/assess`
- `GET|POST /api/portfolio-assessment-intelligence/membership`
- `GET|POST /api/portfolio-assessment-intelligence/dependencies`
- `GET|POST /api/portfolio-assessment-intelligence/resources`
- `GET|POST /api/portfolio-assessment-intelligence/risk`
- `GET|POST /api/portfolio-assessment-intelligence/scenarios`
- `GET|POST /api/portfolio-assessment-intelligence/comparison`
- `GET|POST /api/portfolio-assessment-intelligence/advisory`
- `GET|POST /api/portfolio-assessment-intelligence/replay`
- `GET|POST /api/portfolio-assessment-intelligence/ledger`
- `GET|POST /api/portfolio-assessment-intelligence/certification`
- `POST /api/portfolio-assessment-intelligence/validate`
- `GET|POST /api/portfolio-assessment-intelligence/observability`

## Certification Gate

The certification suite passes only when portfolio identity is deterministic, membership is immutable, versions are fixed, dependencies and resource conflicts are reproducible, aggregate risk and scenario evaluation are complete, alternative portfolio comparison is deterministic, advisory output remains non-executable, replay matches, governance and constitutional constraints are enforced, tenant isolation holds, and all artifacts are integrity-valid.
