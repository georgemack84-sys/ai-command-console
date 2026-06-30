# Phase 7F.2 - Escalation Detection Engine

Phase 7F.2 adds the deterministic detection layer for governance escalation conditions. It consumes tenant-scoped governance intelligence, evaluates supported triggers, and emits validated 7F.1 escalation contract records.

## Scope

The engine evaluates:

- constitutional risk
- authority violations
- policy failures
- compliance degradation
- governance process failures
- severe governance risk
- evidence integrity failures
- replay mismatches
- integrity and ledger inconsistencies

The engine does not execute governance actions, modify policies, change compliance state, approve recommendations, bypass operators, or assign escalation priority.

## Pipeline

The detection pipeline is:

1. Governance input
2. Contract validation
3. Trigger evaluation
4. Evidence collection
5. Governance assessment
6. Escalation detection
7. Confidence calculation
8. Lineage construction
9. Truth Ledger recording
10. Replay verification

## Outputs

Supported outputs are:

- `CONSTITUTIONAL_ESCALATION`
- `AUTHORITY_ESCALATION`
- `POLICY_ESCALATION`
- `COMPLIANCE_ESCALATION`
- `PROCESS_ESCALATION`
- `RISK_ESCALATION`
- `EVIDENCE_ESCALATION`
- `REPLAY_ESCALATION`
- `INTEGRITY_ESCALATION`

## APIs

Authenticated routes are exposed under `/api/escalation-detection`:

- `GET /contract`
- `POST /detect`
- `POST /validate`
- `POST /replay`
- `POST /hash`
- `GET|POST /metrics`
- `GET|POST /inspect`

## Exit State

7F.2 is complete when trigger evaluation, evidence collection, confidence calculation, lineage construction, Truth Ledger recording, replay, metrics, observability, validation, API routes, and unit tests pass.
