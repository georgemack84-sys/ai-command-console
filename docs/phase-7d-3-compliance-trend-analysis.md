# Phase 7D.3 - Compliance Trend Analysis

## Purpose

Phase 7D.3 turns individual 7D.2 compliance evaluations into historical governance intelligence. It explains whether compliance is improving, stable, degrading, volatile, recurring, insufficient, or unknown.

## Deliverables

- Trend window, baseline, score movement, violation pattern, failure pattern, corrective action trend, velocity, stability, historical comparison, risk, ledger, replay, validation, and observability types in `types/compliance-trend.ts`.
- Trend doctrine, history collector, window selector, baseline constructor, score movement analyzer, violation pattern analyzer, failure pattern detector, corrective tracker, velocity calculator, stability calculator, historical analyzer, trend classifier, risk generator, ledger writer, replay verifier, validator, and operator visibility surface in `services/compliance-trend/index.ts`.
- Authenticated API routes under `/api/compliance-trend/*`.
- Certification-readiness tests in `tests/unit/compliance-trend/complianceTrend.test.ts`.

## Pipeline

The trend engine executes:

1. Compliance history collection
2. Time window selection
3. Baseline construction
4. Score movement analysis
5. Violation pattern analysis
6. Corrective action correlation
7. Trend classification
8. Risk indicator generation
9. Stability measurement
10. Historical comparison
11. Trend ledger recording

## Fail-Closed Rules

Missing history or missing baseline produces `INSUFFICIENT_HISTORY`. Invalid source evaluations produce `UNKNOWN`. Tenant leakage, hidden state, ledger write failure, replay mismatch, and trend hash mismatch fail closed and block certification.

## Replay

Every trend record includes a replay snapshot containing source evaluations, trend window, baseline, score movement, violation pattern, corrective action trend, velocity, stability, historical comparison, classification version, risk version, and expected trend/risk outputs.

## Outcome

Mission Control can now explain compliance evolution over time and detect improvement, degradation, recurring failures, corrective effectiveness, compliance velocity, stability, and trend risk before governance erosion becomes a critical failure.
