# Phase 7E.1 Recommendation Contract

7E.1 defines the formal contract for Governance Recommendation Intelligence. It does not generate recommendations; it defines the structure and validation rules every later recommendation must obey.

## Contract Guarantees

- Controlled recommendation types
- Explicit scope and tenant boundaries
- Required evidence, risk, confidence, governance constraints, and alternatives
- Advisory-only authority boundary
- Replay requirements and deterministic hashing
- Truth Ledger linkage
- Lifecycle states and valid transitions
- Fail-closed validation

## Deliverables

- `types/recommendation-contract.ts`
- `services/recommendation-contract/index.ts`
- `app/api/recommendation-contract/*`
- `tests/unit/recommendation-contract/recommendationContract.test.ts`

## API Surface

- `GET /api/recommendation-contract/contract`
- `POST /api/recommendation-contract/validate`
- `POST /api/recommendation-contract/hash`
- `POST /api/recommendation-contract/replay`
- `GET|POST /api/recommendation-contract/inspect`
- `GET|POST /api/recommendation-contract/certify`
- `POST /api/recommendation-contract/transition`

## Certification Result

The contract receives `PASS` when recommendation identity, schema, type, scope, evidence, risk, confidence, governance constraints, advisory-only authority, replay requirements, tenant isolation, and Truth Ledger linkage all validate deterministically.

`CONDITIONAL_PASS` is reserved for minor non-critical lifecycle or presentation gaps. Execution authority, mutation authority, tenant violations, replay gaps, missing evidence, unsupported confidence, or missing Truth Ledger linkage fail closed.
