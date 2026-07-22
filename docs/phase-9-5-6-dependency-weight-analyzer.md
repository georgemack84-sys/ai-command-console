# Mission Control Phase 9.5.6 - Dependency Weight Analyzer

## Preview

Phase 9.5.6 evaluates how strongly a decision unlocks downstream decisions, workflows, mission objectives, and execution sequencing. It analyzes blocked decisions, dependency chain depth, graph influence, cascade impact, bottlenecks, and sequence readiness.

## Tightened Scope

The analyzer produces deterministic advisory dependency weighting for priority scoring. It does not change execution order, authorize execution, override governance decisions, bypass constitutional controls, or replace operator authority. This phase owns dependency assessment artifacts, execution sequence validation, explainability, ledger records, replay, tenant isolation, and the priority-contract `dependency_score`.

## Implementation

Implemented in `services/decision-dependency-weight-analyzer/index.ts`.

Primary APIs:

- `analyzeDependencyWeight`
- `replayDependencyWeightAnalysis`
- `buildDependencyWeightObservability`
- `getDependencyWeightAnalyzerEngine`

Produced artifacts:

- `DependencyWeightAssessment`
- `ExecutionSequenceAssessment`
- `DependencyWeightExplanation`
- `DependencyWeightLedgerRecord`
- `DependencyWeightReplayRecord`
- priority-contract-ready `DecisionPriority`

## Fail-Closed Rules

Analysis fails closed on:

- incomplete dependency graph
- missing dependency references
- failed graph integrity verification
- inconsistent execution sequence
- missing governance references
- missing replay references
- cross-tenant dependency data
- unresolved dependency cycles
- non-reproducible canonical graph ordering
- hidden dependency weighting
- replay mismatch

## Determinism

Dependency scores use fixed formulas, canonical reference ordering, stable timestamps, deterministic classifications, immutable ledger records, and replay reconstruction from persisted artifacts. Critical bottlenecks and large cascades elevate dependency weight, while invalid sequencing restricts execution readiness. All outputs remain advisory-only.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-dependency-weight-analyzer\decisionDependencyWeightAnalyzer.test.ts tests\unit\decision-operational-impact-assessment\decisionOperationalImpactAssessment.test.ts tests\unit\decision-governance-constitutional-priority-weighting\decisionGovernanceConstitutionalPriorityWeighting.test.ts tests\unit\decision-risk-confidence-prioritization\decisionRiskConfidencePrioritization.test.ts tests\unit\decision-mission-urgency-scoring\decisionMissionUrgencyScoring.test.ts tests\unit\decision-priority-contract\decisionPriorityContract.test.ts
```

Result: 6 files, 30 tests passed.
