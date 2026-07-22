# Phase 8ALT.5.1 - Explainability Contract

The Explainability Contract defines the universal deterministic schema for explanations across Controlled Autonomy. It is separate from domain-specific explainability engines and provides identity, decision summary, option selection, rejected alternatives, evidence, policy, constitutional, authority, confidence, risk, replay, integrity, tenant isolation, and anti-fabrication requirements.

## Implemented Scope

- Universal `ExplanationRecord` and append-only `ExplanationRepository`.
- Explanation type registry for planning, execution, delegation, orchestration, supervision, governance, intervention, and replay.
- Deterministic registration, retrieval, validation, replay, search, and observability.
- Fail-closed validation for missing identifiers, incomplete schema, missing evidence/policy/constitutional/authority references, invalid replay, hash mismatch, ordering violation, cross-tenant references, fabricated reasoning, and advisory-only violation.
- Authenticated APIs under `/api/explainability-contract/*`.

## API Surface

- `GET /api/explainability-contract/contract`
- `POST /api/explainability-contract/register`
- `POST /api/explainability-contract/get`
- `POST /api/explainability-contract/validate`
- `POST /api/explainability-contract/replay`
- `POST /api/explainability-contract/search`
- `GET|POST /api/explainability-contract/inspect`
