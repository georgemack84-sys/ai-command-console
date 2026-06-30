# Phase 7C.4 - Governance Risk Scoring

## Purpose

Phase 7C.4 converts governance weakness intelligence into deterministic, operator-ready governance risk scores. Scores are advisory-only, evidence-backed, tenant-scoped, replayable, versioned, and certification-ready.

## Deliverables

- Risk score output schema, normalized scoring inputs, scoring basis, drivers, evidence summary, replay package, validator, and observability types in `types/governance-risk-scoring.ts`.
- Scoring input aggregation, factor normalization, base score engine, modifier engine, critical floor rules, threshold mapping, confidence scoring, risk driver extraction, evidence summary, explanation, replay, and validation in `services/governance-risk-scoring/index.ts`.
- Authenticated API routes under `/api/governance-risk-scoring/*`.
- Certification tests in `tests/unit/governance-risk-scoring/governanceRiskScoring.test.ts`.

## Models

- Scoring model: `GOV-RISK-SCORE-V1`
- Confidence model: `GOV-RISK-CONFIDENCE-V1`
- Severity thresholds: `GOV-RISK-THRESHOLD-V1`
- Driver extraction model: `GOV-RISK-DRIVER-V1`
- Explanation model: `GOV-RISK-EXPLANATION-V1`

## Severity

Scores map to `LOW`, `MODERATE`, `HIGH`, and `CRITICAL` using immutable thresholds. Critical floor rules prevent confirmed tenant boundary issues, severe authority expansion, unreplayable critical behavior, and repeated certification failure affecting replay from being downgraded below required minimums.

## Confidence

Confidence is calculated independently from severity using evidence completeness, source reliability, lineage completeness, replay success, policy match strength, pattern strength, weakness confidence, and data consistency.

## Replay

Every score includes normalized scoring inputs, model versions, scoring input references, source record hashes, a scoring result hash, and a risk hash. Replay reconstructs the score from the stored scoring basis and fails closed on tampering.

## Operator Surface

Operators can inspect risk category, severity, numeric score, confidence, drivers, base score, modifiers, critical floors, model versions, evidence summary, related records, tenant isolation status, lineage status, replay status, certification status, visibility status, review priority, and explanation.
