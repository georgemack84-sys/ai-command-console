# Phase 8ALT.3.1 - Prediction Contract

## Purpose

Phase 8ALT.3.1 defines the deterministic contract for Predictive Autonomy Intelligence. It standardizes prediction objects, forecast lifecycle states, validation rules, evidence requirements, governance metadata, lineage, replay references, tenant isolation, and advisory-only constraints.

## Implementation

- `types/prediction-contract.ts` defines prediction types, lifecycle states, evidence, governance metadata, constitutional metadata, lineage, replay, validation results, and observability surfaces.
- `services/prediction-contract/index.ts` creates deterministic prediction records, validates lifecycle transitions, validates predictions, hashes immutable records, and exposes the canonical contract.
- `app/api/prediction-contract/*` exposes authenticated contract, prediction, validation, transition, evidence, governance, and replay routes.
- `tests/unit/prediction-contract/predictionContract.test.ts` verifies schema validity, supported types, lifecycle transitions, evidence, governance metadata, lineage, replay, integrity, tenant isolation, advisory-only behavior, and required rejection cases.

## Guarantees

- Prediction records are deterministic, replayable, and hash-verifiable.
- Evidence, governance metadata, lineage, replay references, and integrity hashes are mandatory.
- Probability is bounded from 0 to 1.
- Projected confidence is reproducible.
- Tenant isolation is enforced.
- Prediction-driven autonomous action is rejected.
- Operator approval remains required for any action based on a prediction.

## Verification

Run:

```bash
npx vitest run tests/unit/prediction-contract
npm run typecheck
```
