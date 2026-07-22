# Mission Control Phase 9.5.3 - Risk & Confidence Prioritization

## Preview

Phase 9.5.3 incorporates risk intelligence and confidence assessment into the Decision Priority Engine. It adjusts prioritization based on operational risk, probability, impact, evidence reliability, uncertainty, and confidence degradation while remaining advisory-only.

## Tightened Scope

The engine produces risk and confidence scoring artifacts for the priority system. It does not authorize execution or override governance, constitutional controls, or operator authority. This phase owns risk severity, probability, impact, confidence, evidence reliability, uncertainty, degradation, escalation, priority adjustment, ledger evidence, and replay.

## Implementation

Implemented in `services/decision-risk-confidence-prioritization/index.ts`.

Primary APIs:

- `prioritizeRiskAndConfidence`
- `replayRiskConfidencePrioritization`
- `buildRiskConfidenceObservability`
- `getRiskConfidencePrioritizationEngine`

Produced artifacts:

- `RiskPriorityAssessment`
- `ConfidenceAssessment`
- `RiskConfidenceExplanation`
- `RiskConfidenceLedgerRecord`
- `RiskConfidenceReplayRecord`
- priority-contract-ready `DecisionPriority`

## Fail-Closed Rules

Prioritization fails closed on:

- incomplete risk data
- missing evidence references
- invalid confidence inputs
- missing governance references
- missing replay references
- integrity or replay mismatch
- cross-tenant references
- hidden prioritization references

## Determinism

Risk and confidence scores use fixed formulas, canonical reference ordering, deterministic classifications, stable timestamp refs, immutable ledger records, and replay reconstruction from persisted artifacts. High-risk high-confidence decisions are elevated; high-risk low-confidence decisions are escalated and restricted.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-risk-confidence-prioritization\decisionRiskConfidencePrioritization.test.ts tests\unit\decision-mission-urgency-scoring\decisionMissionUrgencyScoring.test.ts tests\unit\decision-priority-contract\decisionPriorityContract.test.ts
```

Result: 3 files, 15 tests passed.
