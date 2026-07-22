# Mission Control Phase 9.5.9 - Priority Ledger

## Preview

Phase 9.5.9 provides the immutable system of record for priority evaluations, rankings, scoring lineage, governance references, evidence references, explanations, replay metadata, and integrity verification.

## Tightened Scope

The ledger persists already-generated priority outputs. It does not recalculate priority, change ranking, authorize execution, mutate historical records, or delete records. It owns append-only ledger records, history records, ranking timeline, evidence/governance/explanation registries, replay indexes, metadata, audit reports, and integrity verification.

## Implementation

Implemented in `services/decision-priority-ledger/index.ts`.

Primary APIs:

- `writePriorityLedger`
- `replayPriorityLedger`
- `verifyPriorityLedgerIntegrity`
- `queryPriorityAudit`
- `buildPriorityLedgerObservability`
- `getPriorityLedgerEngine`

Produced artifacts:

- `PriorityLedgerRecord`
- `PriorityHistoryRecord`
- `PriorityReplayIndex`
- `PriorityRankingTimelineRecord`
- `PriorityLedgerMetadataRecord`
- `PriorityAuditReport`
- `PriorityLedgerReplayRecord`

## Fail-Closed Rules

Ledger writes fail closed on:

- missing priority score
- incomplete ranking information
- missing evidence references
- missing governance references
- missing explanation references
- missing replay references
- integrity verification failure
- failed canonical ordering
- cross-tenant references
- duplicate ledger sequence numbers
- mutation or deletion attempts
- replay mismatch

## Determinism

Ledger records use canonical sequence numbers, canonical candidate ordering, stable timestamps, immutable record hashes, replay indexes, deterministic ranking timelines, and reproducible audit queries.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-priority-ledger\decisionPriorityLedger.test.ts tests\unit\decision-priority-explanation-engine\decisionPriorityExplanationEngine.test.ts tests\unit\decision-priority-scoring-engine\decisionPriorityScoringEngine.test.ts tests\unit\decision-dependency-weight-analyzer\decisionDependencyWeightAnalyzer.test.ts tests\unit\decision-operational-impact-assessment\decisionOperationalImpactAssessment.test.ts tests\unit\decision-governance-constitutional-priority-weighting\decisionGovernanceConstitutionalPriorityWeighting.test.ts tests\unit\decision-risk-confidence-prioritization\decisionRiskConfidencePrioritization.test.ts tests\unit\decision-mission-urgency-scoring\decisionMissionUrgencyScoring.test.ts tests\unit\decision-priority-contract\decisionPriorityContract.test.ts
```

Result: 9 files, 44 tests passed.
