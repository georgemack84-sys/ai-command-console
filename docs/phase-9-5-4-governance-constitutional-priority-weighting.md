# Mission Control Phase 9.5.4 - Governance & Constitutional Priority Weighting

## Preview

Phase 9.5.4 adds governance-aware priority weighting to the Decision Priority Engine. It raises visibility for constitutional obligations, governance conflicts, policy violations, authority conflicts, certification blockers, compliance failures, and regulatory exposure.

## Tightened Scope

The engine produces deterministic advisory weighting artifacts for downstream priority orchestration. It does not authorize execution, modify governance policy, bypass constitutional controls, or override operator authority. Governance supremacy, constitutional enforcement, replay integrity, tenant isolation, and fail-closed validation remain mandatory.

## Implementation

Implemented in `services/decision-governance-constitutional-priority-weighting/index.ts`.

Primary APIs:

- `weightGovernanceAndConstitutionalPriority`
- `replayGovernanceConstitutionalPriorityWeighting`
- `buildGovernanceConstitutionalPriorityObservability`
- `getGovernanceConstitutionalPriorityWeightingEngine`

Produced artifacts:

- `GovernancePriorityAssessment`
- `AuthorityConflictAssessment`
- `GovernancePriorityExplanation`
- `GovernancePriorityLedgerRecord`
- `GovernancePriorityReplayRecord`
- priority-contract-ready `DecisionPriority`

## Fail-Closed Rules

Weighting fails closed on:

- missing governance references
- missing constitutional references
- incomplete authority metadata
- unverifiable certification status
- invalid compliance inputs
- missing replay references
- integrity or replay mismatch
- cross-tenant governance data
- hidden governance weighting references

## Determinism

Governance scores use fixed formulas, canonical reference ordering, stable timestamps, immutable ledger records, deterministic classifications, and replay reconstruction from persisted artifacts. Constitutional violations trigger immediate governance review, authority conflicts route to operator review, and all outputs remain advisory-only.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-governance-constitutional-priority-weighting\decisionGovernanceConstitutionalPriorityWeighting.test.ts tests\unit\decision-risk-confidence-prioritization\decisionRiskConfidencePrioritization.test.ts tests\unit\decision-mission-urgency-scoring\decisionMissionUrgencyScoring.test.ts tests\unit\decision-priority-contract\decisionPriorityContract.test.ts
```

Result: 4 files, 20 tests passed.
