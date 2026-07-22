# Phase 9.10.5 - Replay Difference Detector

## Preview

The Replay Difference Detector proves whether deterministic replay is identical to the original orchestration or explains the divergence when it is not. It compares replay outputs by domain, classifies differences, assigns root causes and severity, emits audit-ready drift reports, and produces an operator-visible divergence dashboard.

## Tightened Contract

- Difference detection is deterministic, advisory-only, and non-mutating.
- The detector compares candidate, context, priority, conflict, governance, package, operator, outcome, and integrity domains.
- Differences are classified into `IDENTICAL`, `MINOR_DIFFERENCE`, `GOVERNANCE_DIFFERENCE`, `REPLAY_FAILURE`, or `INTEGRITY_FAILURE`.
- Unknown root cause, tenant boundary violations, broken lineage, unsupported versions, material replay divergence, governance differences, and integrity failures block certification.
- Minor differences are allowed only when explicitly non-material.
- Difference records, drift reports, dashboards, and diff ledger entries are hash-verifiable and immutable.

## Implementation

- Types: `types/decision-replay-difference-detector.ts`
- Service: `services/decision-replay-difference-detector/index.ts`
- Tests: `tests/unit/decision-replay-difference-detector/decisionReplayDifferenceDetector.test.ts`

The service provides replay diff comparison, classification, root-cause analysis, drift reporting, dashboard modeling, diff integrity hashing, and append-only diff ledger writing for Phase 9.10 replay certification.
