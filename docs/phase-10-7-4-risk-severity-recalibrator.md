# Phase 10.7.4 - Risk Severity Recalibrator

## Preview

The Risk Severity Recalibrator converts historical risk assessments, actual mission outcomes, and drift evidence into deterministic recalibration proposals. It evaluates severity, probability, impact, escalation threshold, and rollback threshold calibration, then produces governed recommendations for future review.

## Tightened Contract

The recalibrator is advisory only. It must not mutate production severity models, probability models, escalation thresholds, rollback policies, governance policy, historical evidence, or mission history.

Every output must be:

- deterministic and replayable
- evidence-backed and explainable
- tenant-isolated
- simulation-ready
- governance-visible
- constitutionally constrained
- preserved in an immutable ledger

## Implemented Surface

- `POST /risk-severity-recalibrator/analyze`
- `POST /risk-severity-recalibrator/records`
- `POST /risk-severity-recalibrator/calibration`
- `POST /risk-severity-recalibrator/probability`
- `POST /risk-severity-recalibrator/impact`
- `POST /risk-severity-recalibrator/thresholds`
- `POST /risk-severity-recalibrator/escalation`
- `POST /risk-severity-recalibrator/rollback`
- `POST /risk-severity-recalibrator/proposals`
- `POST /risk-severity-recalibrator/governance`
- `POST /risk-severity-recalibrator/evidence`
- `POST /risk-severity-recalibrator/ledger`
- `POST /risk-severity-recalibrator/validation`
- `POST /risk-severity-recalibrator/replay`
- `GET /risk-severity-recalibrator/contract`

## Certification Rules

Certification fails closed when historical assessments, actual outcomes, evidence, deterministic calculations, explainable logic, replay references, governance references, constitutional references, lineage, simulation readiness, tenant isolation, integrity hashes, or advisory-only protections are incomplete.

Replay must reproduce identical records, calibration analysis, proposals, evidence registry, ledger, validation output, replay hash, and integrity hash.
