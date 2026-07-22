# Phase 12.10 - Outcome Observation & Recommendation Evaluation

Phase 12.10 establishes deterministic observation and effectiveness evaluation for completed recommendation cycles. The implementation lives in `services/outcome-observation-evaluation` and consumes Phase 12.9 Recommendation Synthesis Intelligence as the immutable recommendation source.

## Implemented Capabilities

- Canonical `OutcomeObservationArtifact` with deterministic identity, recommendation refs, window refs, evidence refs, metrics, outcomes, qualification, confidence, uncertainty, effectiveness, variance, policy binding, and integrity hash.
- Deterministic observation window contract with one open, one close, immutable timing, grace period, late evidence policy, and expiration behavior.
- Append-only observation evidence collection with source identity, timeline, duplicate detection, recommendation immutability, and integrity validation.
- Observation qualification with evidence completeness, policy, governance, temporal validity, source authenticity, replay eligibility, confidence, and uncertainty.
- Deterministic closure with outstanding evidence disposition and immutable final status.
- Effectiveness evaluation with benefit realization, realized risk, forecast accuracy, baseline improvement, portfolio contribution, resource efficiency, governance impact, operator burden, score, and variance analysis.
- Missing and late evidence handling that never mutates historical evaluations.
- Replay report, append-only ledger, observability report, and certification suite.

## API Surface

- `GET /api/outcome-observation-evaluation/contract`
- `GET|POST /api/outcome-observation-evaluation/create`
- `GET|POST /api/outcome-observation-evaluation/window`
- `GET|POST /api/outcome-observation-evaluation/collect`
- `GET|POST /api/outcome-observation-evaluation/qualify`
- `POST /api/outcome-observation-evaluation/close`
- `GET|POST /api/outcome-observation-evaluation/evaluate`
- `GET|POST /api/outcome-observation-evaluation/evidence`
- `GET|POST /api/outcome-observation-evaluation/replay`
- `GET|POST /api/outcome-observation-evaluation/ledger`
- `GET|POST /api/outcome-observation-evaluation/certification`
- `POST /api/outcome-observation-evaluation/validate`
- `GET|POST /api/outcome-observation-evaluation/observability`

## Certification Gate

The certification suite passes only when the recommendation remains immutable, one deterministic observation window exists, evidence is append-only and qualified, closure is deterministic, effectiveness calculations are reproducible, missing and late evidence are explicit, replay restores identical timelines and evaluations, policy and governance are enforced, tenant isolation holds, and the observation ledger is append-only.
