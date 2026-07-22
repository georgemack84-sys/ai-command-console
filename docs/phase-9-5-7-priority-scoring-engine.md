# Mission Control Phase 9.5.7 - Priority Scoring Engine

## Preview

Phase 9.5.7 combines canonical priority dimensions into deterministic composite scores, priority states, and ranking order for Decision Candidates.

## Tightened Scope

The engine resolves approved weight profiles, calculates factor contributions, applies governance/confidence/dependency constraints, ranks active candidates, separates blocked candidates, excludes rejected candidates from active ranking, explains tie-breaks, persists ledger records, and supports replay. It remains advisory-only and cannot authorize execution or override governance, constitutional controls, or operator authority.

## Implementation

Implemented in `services/decision-priority-scoring-engine/index.ts`.

Primary APIs:

- `createPriorityWeightProfile`
- `scoreDecisionPriorities`
- `replayPriorityScoring`
- `buildPriorityScoringObservability`
- `getPriorityScoringEngine`

Produced artifacts:

- `PriorityWeightProfile`
- `CompositePriorityScore`
- `PriorityRankingRecord`
- `PriorityScoringExplanation`
- `PriorityScoringLedgerRecord`
- `PriorityScoringReplayRecord`
- priority-contract-ready `DecisionPriority`

## Fail-Closed Rules

Scoring fails closed on:

- missing required factor scores
- out-of-range scores
- missing or invalid weight profile
- non-normalized weights
- missing governance override rules
- missing governance references
- missing replay references
- invalid profile integrity hash
- cross-tenant references
- unreproducible tie-break ordering
- hidden ranking logic
- replay mismatch

## Determinism

Composite scoring uses canonical factor order, normalized approved weights, deterministic state resolution, fixed tie-break order, canonical candidate ID ordering, stable timestamps, immutable ledger records, and replay reconstruction from persisted artifacts.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-priority-scoring-engine\decisionPriorityScoringEngine.test.ts tests\unit\decision-dependency-weight-analyzer\decisionDependencyWeightAnalyzer.test.ts tests\unit\decision-operational-impact-assessment\decisionOperationalImpactAssessment.test.ts tests\unit\decision-governance-constitutional-priority-weighting\decisionGovernanceConstitutionalPriorityWeighting.test.ts tests\unit\decision-risk-confidence-prioritization\decisionRiskConfidencePrioritization.test.ts tests\unit\decision-mission-urgency-scoring\decisionMissionUrgencyScoring.test.ts tests\unit\decision-priority-contract\decisionPriorityContract.test.ts
```

Result: 7 files, 35 tests passed.
