# Mission Control Phase 9.5.8 - Priority Explanation Engine

## Preview

Phase 9.5.8 turns every priority score, state, and ranking into a deterministic human-readable explanation for operators, reviewers, auditors, and governance authorities.

## Tightened Scope

The engine explains existing priority scoring artifacts. It does not modify scores, change ranking, authorize execution, bypass governance, or override operator authority. It owns ranking rationale, scoring breakdowns, evidence narratives, governance explanations, risk and confidence narratives, dependency and operational narratives, operator summaries, replay validation, and immutable explanation ledger records.

## Implementation

Implemented in `services/decision-priority-explanation-engine/index.ts`.

Primary APIs:

- `explainPriorities`
- `replayPriorityExplanations`
- `buildPriorityExplanationObservability`
- `getPriorityExplanationEngine`

Produced artifacts:

- `PriorityExplanationRecord`
- `OperatorPrioritySummary`
- `PriorityExplanationReport`
- `PriorityExplanationLedgerRecord`
- `PriorityExplanationReplayRecord`

## Fail-Closed Rules

Explanation generation fails closed on:

- incomplete ranking rationale
- missing scoring breakdown
- untraceable supporting evidence
- missing governance references
- missing replay references
- nondeterministic explanation ordering
- integrity verification failure
- cross-tenant reference leakage
- hidden scoring logic
- unexplained governance adjustment
- replay mismatch

## Determinism

Explanations use canonical candidate ordering, canonical factor ordering, stable timestamps, deterministic narratives, immutable ledger records, and replay reconstruction from persisted explanation artifacts.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-priority-explanation-engine\decisionPriorityExplanationEngine.test.ts tests\unit\decision-priority-scoring-engine\decisionPriorityScoringEngine.test.ts tests\unit\decision-dependency-weight-analyzer\decisionDependencyWeightAnalyzer.test.ts tests\unit\decision-operational-impact-assessment\decisionOperationalImpactAssessment.test.ts tests\unit\decision-governance-constitutional-priority-weighting\decisionGovernanceConstitutionalPriorityWeighting.test.ts tests\unit\decision-risk-confidence-prioritization\decisionRiskConfidencePrioritization.test.ts tests\unit\decision-mission-urgency-scoring\decisionMissionUrgencyScoring.test.ts tests\unit\decision-priority-contract\decisionPriorityContract.test.ts
```

Result: 8 files, 39 tests passed.
