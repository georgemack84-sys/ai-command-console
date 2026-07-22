# Mission Control Phase 9.5.2 - Mission & Urgency Scoring Engine

## Preview

Phase 9.5.2 deterministically evaluates how important a decision is to mission success and how urgently it must be addressed. It transforms mission objectives, milestones, critical paths, deadlines, delay penalties, execution windows, and time-sensitive events into priority-ready mission and urgency scores.

## Tightened Scope

The engine produces advisory-only scoring artifacts for the priority system. It does not make execution decisions or replace later risk/confidence scoring. This phase owns mission criticality, urgency classification, timing analysis, critical-path effects, delay penalties, explanations, ledger evidence, and replay.

## Implementation

Implemented in `services/decision-mission-urgency-scoring/index.ts`.

Primary APIs:

- `scoreMissionAndUrgency`
- `replayMissionUrgencyScoring`
- `buildMissionUrgencyObservability`
- `getMissionUrgencyScoringEngine`

Produced artifacts:

- `MissionCriticalityAssessment`
- `UrgencyAssessment`
- `MissionUrgencyExplanation`
- `MissionUrgencyLedgerRecord`
- `MissionUrgencyReplayRecord`
- priority-contract-ready `DecisionPriority`

## Fail-Closed Rules

Scoring fails closed on:

- missing mission objectives
- invalid deadlines
- incomplete critical-path references
- inconsistent timing data
- missing governance references
- missing replay references
- cross-tenant references
- integrity or replay mismatch
- hidden scoring references

## Determinism

Mission and urgency scores use fixed scoring components, canonical reference ordering, stable timestamp refs, deterministic classifications, immutable hashes, and replay reconstruction from persisted artifacts. Emergency events, deadline pressure, execution windows, delay penalties, and downstream blockers all contribute through explicit scoring rules.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-mission-urgency-scoring\decisionMissionUrgencyScoring.test.ts tests\unit\decision-priority-contract\decisionPriorityContract.test.ts
```

Result: 2 files, 10 tests passed.
