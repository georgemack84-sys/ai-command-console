# Phase 13.3 - Assurance Evaluation Contract

Phase 13.3 establishes the canonical evaluation contract shared by Mission Control assurance engines. It closes the terminal result vocabulary to `PASS`, `FAIL`, and `PRUNED`, standardizes deterministic inputs and evidence qualification, fixes the evaluation sequence, requires reproducible explanations, records immutable ledger entries, and validates exact replay.

## Service

`services/assurance-evaluation-contract` exposes:

- `runAssuranceEvaluationContract(input?)`
- `validateAssuranceEvaluationContract(result?)`
- `replayAssuranceEvaluationContract(result?)`
- `getAssuranceEvaluationContractBundle()`

The service consumes Phase 13.2 dependency evaluation as upstream context.

## API

Authenticated workspace members can inspect:

- `GET /api/assurance-evaluation-contract/contract`
- `GET|POST /api/assurance-evaluation-contract/inputs`
- `GET|POST /api/assurance-evaluation-contract/evidence`
- `GET|POST /api/assurance-evaluation-contract/vocabulary`
- `GET|POST /api/assurance-evaluation-contract/execution`
- `GET|POST /api/assurance-evaluation-contract/explanation`
- `GET|POST /api/assurance-evaluation-contract/ledger`
- `GET|POST /api/assurance-evaluation-contract/replay`
- `GET|POST /api/assurance-evaluation-contract/certification`
- `POST /api/assurance-evaluation-contract/validate`

POST requests may provide a `result` or a scenario such as `VOCABULARY_OPEN`, `CUSTOM_TERMINAL_OUTCOME_ACCEPTED`, `REPLAY_OUTCOME_MISMATCH`, or `INTEGRITY_FAILURE`.
