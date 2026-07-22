# Phase 8ALT.5.5 - Explainability Certification Gate

The Explainability Certification Gate certifies the complete 8ALT.5 explainability stack before subsequent Controlled Autonomy capabilities proceed. It orchestrates validation across the Explainability Contract, Decision Narrative Engine, Evidence & Policy Reasoning Graph, and Confidence & Risk Reasoning Engine.

## Implemented Scope

- Immutable append-only certification ledgers and reports.
- Deterministic certification test rows matching the prompt certification suite.
- Contract, schema, narrative, evidence, policy, constitutional, authority, confidence/risk, replay, integrity, tenant-isolation, and advisory-only validation.
- Fail-closed scenarios for missing explanations, fabricated explanations, hidden evidence, policy omission, authority omission, confidence replay mismatch, risk replay mismatch, nondeterministic wording, cross-tenant leakage, replay mismatch, and integrity failure.
- Certification replay, report generation, validation, observability, Truth Ledger references, lineage references, replay references, and integrity hashes.

## API Surface

- `GET /api/explainability-certification-gate/contract`
- `POST /api/explainability-certification-gate/run`
- `POST /api/explainability-certification-gate/validate-explanation`
- `POST /api/explainability-certification-gate/validate-replay`
- `POST /api/explainability-certification-gate/report`
- `GET|POST /api/explainability-certification-gate/inspect`
