# Phase 8ALT.4.7 - Mission Health Recommendation Engine

The Mission Health Recommendation Engine generates deterministic, evidence-backed, governance-validated advisory recommendations from Health Explainability output. Recommendations are ranked, confidence-scored, replayable, lineage-linked, and always require operator approval before any downstream action.

## Implemented Scope

- Recommendation sets derived from `HealthExplanation`.
- Deterministic recommendation selection, priority, severity, confidence, risk score, and stable ordering.
- Advisory categories for operator review, subsystem inspection, replay validation, integrity verification, predictive monitoring, execution pause recommendation, recovery recommendation, governance review, and certification review.
- Governance validation with `operator_approval_required: true`, `execution_authority_granted: false`, and `recovery_authority_granted: false`.
- Evidence, lineage, replay, integrity, tenant isolation, authority, and advisory-only validation.
- Authenticated APIs under `/api/mission-health-recommendation-engine/*`.

## API Surface

- `GET /api/mission-health-recommendation-engine/contract`
- `POST /api/mission-health-recommendation-engine/recommend`
- `POST /api/mission-health-recommendation-engine/priority`
- `POST /api/mission-health-recommendation-engine/confidence`
- `POST /api/mission-health-recommendation-engine/evidence`
- `POST /api/mission-health-recommendation-engine/operator-report`
- `POST /api/mission-health-recommendation-engine/governance-validation`
- `POST /api/mission-health-recommendation-engine/replay`
- `POST /api/mission-health-recommendation-engine/validate`
- `GET|POST /api/mission-health-recommendation-engine/inspect`

## Certification Notes

- Recommendations never execute, pause, recover, modify governance, escalate authority, or alter subsystem state.
- Execution pause and recovery recommendations are advisory records only.
- Negative scenarios are represented in output and rejected by validation.
