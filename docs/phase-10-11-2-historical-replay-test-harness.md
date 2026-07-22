# Phase 10.11.2 - Historical Replay Test Harness

## Purpose

Establish the deterministic Historical Replay Test Harness for validating adaptive proposals against actual historical Mission Control executions before any counterfactual or adaptive simulation can proceed.

Historical replay is a baseline validation step. It observes immutable history and verifies exact reproducibility; it never rewrites history, approves proposals, deploys changes, mutates production behavior, introduces synthetic data, or changes operator authority.

## Tightened Contract

- Harness version: `historical-replay-test-harness/v1`
- Harness identifier: `HistoricalReplayTestHarness`
- Required predecessor: Phase 10.11.1 adaptive simulation contract
- Valid outcomes: `PASS`, `CONDITIONAL_PASS`, `FAIL`, `REQUIRES_MORE_EVIDENCE`, `REQUIRES_GOVERNANCE_REVIEW`
- Replay proof: stable replay hash plus nested integrity hashes for API, validation checks, validation object, metrics, adaptive simulation contract, replay reports, and simulation validation ledger entry

## Replay Scope

The harness validates previous missions, previous decisions, previous recommendations, operator actions, governance reviews, approval workflows, rollback events, confidence evolution, and risk evolution.

Each scope records the historical elements replayed and the validation requirements needed for exact reproduction, including identical inputs, outputs, event sequence, logical timestamps, and state transitions.

## Authorized Sources

Historical replay may consume only authorized historical sources:

- Truth Ledger
- Recommendation Ledger
- Decision Graph
- Governance Ledger
- Replay Ledger
- Risk History
- Confidence History
- Mission Timeline
- Operator Activity Ledger
- Approval Ledger
- Rollback Ledger

No external or synthetic data is permitted.

## HistoricalReplayValidation

The service produces the canonical validation object from the prompt:

- `replay_id`
- `proposal_id`
- `tenant_id`
- `replay_scope`
- `historical_execution_reference`
- `replay_execution_reference`
- `baseline_hash`
- `replay_hash`
- `deterministic`
- `replay_matches_history`
- `recommendation_consistent`
- `governance_preserved`
- `operator_preserved`
- `evidence_consistent`
- `confidence_consistent`
- `risk_consistent`
- `replay_explanation`
- `validation_result`
- `integrity_hash`

## Failure Behavior

The harness fails closed for nondeterministic replay, replay drift, recommendation inconsistency, evidence mismatch, governance behavior changes, constitutional violations, operator workflow changes, approval sequence changes, replay hash mismatch, missing historical evidence, rollback inconsistency, tenant isolation breach, replay corruption, integrity failure, synthetic data introduction, production mutation, and approval or deployment attempts.

## Implementation

- Types: `types/historical-replay-test-harness.ts`
- Service: `services/historical-replay-test-harness/index.ts`
- API routes: `app/api/historical-replay-test-harness/*`
- Tests: `tests/unit/historical-replay-test-harness/historicalReplayTestHarness.test.ts`

The exported service exposes `validateHistoricalReplay`, `replayHistoricalReplayValidation`, and `getHistoricalReplayTestHarnessFoundation`.
