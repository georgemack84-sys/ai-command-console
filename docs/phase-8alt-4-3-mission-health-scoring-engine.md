# Phase 8ALT.4.3 - Mission Health Scoring Engine

The Mission Health Scoring Engine converts certified subsystem health collection records into a deterministic, confidence-adjusted mission health score. It remains advisory-only and never initiates execution, recovery, governance edits, authority changes, or subsystem mutation.

## Implemented Scope

- Certified subsystem weighting profile for planning, orchestration, delegation, runtime supervision, governance, replay, integrity, and authority.
- Deterministic weighted base score, confidence adjustment, consistency score, operational readiness, stability index, degradation severity, and health state.
- Evidence-linked scoring output with lineage references, replay references, integrity hashes, immutable source collection references, and reproducible score hashes.
- Validation gate for subsystem completeness, certified identities, weighting integrity, confidence bounds, normalization integrity, evidence completeness, replay, lineage, integrity, governance, constitutional safety, authority, tenant isolation, and advisory-only behavior.
- Replay reconstruction for score hash determinism.
- Authenticated API surface under `/api/mission-health-scoring-engine/*`.

## Certified Weights

| Subsystem | Weight |
| --- | ---: |
| planning | 0.15 |
| orchestration | 0.15 |
| delegation | 0.10 |
| runtime_supervision | 0.15 |
| governance | 0.15 |
| replay | 0.10 |
| integrity | 0.10 |
| authority | 0.10 |

## API Surface

- `GET /api/mission-health-scoring-engine/contract`
- `POST /api/mission-health-scoring-engine/score`
- `POST /api/mission-health-scoring-engine/weights`
- `POST /api/mission-health-scoring-engine/confidence`
- `POST /api/mission-health-scoring-engine/readiness`
- `POST /api/mission-health-scoring-engine/stability`
- `POST /api/mission-health-scoring-engine/degradation`
- `POST /api/mission-health-scoring-engine/evidence`
- `POST /api/mission-health-scoring-engine/replay`
- `POST /api/mission-health-scoring-engine/validate`
- `GET|POST /api/mission-health-scoring-engine/inspect`

## Exit Criteria Mapping

- Deterministic mission health scoring is operational across all certified subsystem health inputs.
- Weights, confidence, readiness, stability, degradation, evidence, replay, lineage, and integrity are included in unified score output.
- Missing subsystem, duplicate subsystem, invalid weight, invalid confidence, missing evidence, replay mismatch, broken lineage, integrity failure, governance failure, tenant violation, and advisory-only violations are rejected.
- All outputs remain immutable, replayable, tenant-isolated, governance-compliant, and advisory-only.
