# Phase 8ALT.9.7 - Knowledge Validation & Governance Engine

The Knowledge Validation & Governance Engine validates candidate knowledge artifacts before they can become eligible for later certification and operator approval.

## Scope

- Read-only and advisory-only validation.
- Consumes Phase 8ALT.9.4 candidate knowledge artifacts as the concrete artifact source.
- Produces deterministic validation records, certification readiness records, and immutable rejection audits.
- Validates schema, evidence, replay, determinism, governance, constitutional compliance, authority boundaries, tenant isolation, integrity, lineage, and explainability.
- Never certifies, activates, stores into the final ledger, bypasses operator approval, or modifies governance or constitutional policy.

## API Surface

- `GET /api/knowledge-validation-governance-engine/validate`
- `POST /api/knowledge-validation-governance-engine/validate`
- `POST /api/knowledge-validation-governance-engine/records`
- `POST /api/knowledge-validation-governance-engine/readiness`
- `POST /api/knowledge-validation-governance-engine/audit`
- `GET /api/knowledge-validation-governance-engine/inspect`
- `POST /api/knowledge-validation-governance-engine/inspect`

## Non-Authority Guarantees

All validation repositories carry `read_only: true`, `advisory_only: true`, `certification_authorized: false`, `activation_authorized: false`, `operator_approval_bypass_authorized: false`, `governance_modification_authorized: false`, and `constitutional_modification_authorized: false`.
