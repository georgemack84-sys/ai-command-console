# Phase 10.8.4 - Tenant Isolation Validator

The Tenant Isolation Validator is the multi-tenant security gate for adaptive proposals. It verifies that a proposal belongs only to its originating tenant and cannot influence, consume, inherit from, or modify another tenant's adaptive intelligence, governance state, evidence, replay history, certification state, or operational behavior.

## Tightened Prompt

Validate every adaptive proposal for complete tenant isolation before simulation or governance review. Resolve tenant identity, verify proposal ownership, validate data, recommendation, replay, evidence, ledger, governance, and certification isolation, detect direct and indirect leakage paths, preserve tenant lineage, and persist an immutable tenant isolation ledger entry.

The validator must remain constitution-first, tenant-first, deterministic, replayable, explainable, evidence-backed, advisory-only, fail-closed, privacy-preserving, least-access by default, and zero-cross-tenant-influence.

## Implemented Scope

- Typed tenant isolation contract in `types/tenant-isolation-validator.ts`.
- Deterministic service in `services/tenant-isolation-validator`.
- Ownership, data, recommendation, replay, evidence, ledger, governance, certification, leakage, lineage, replay, and ledger outputs.
- Explicit multi-tenant posture: `tenant_first: true`, `privacy_preserving: true`, `least_access_enforced: true`, and no support for cross-tenant learning, optimization, shared evidence, or shared replay.
- Rejection for cross-tenant data access, recommendation influence, learning, optimization, shared replay, shared evidence, authority propagation, and foreign tenant references.
- Fail-closed handling for unverifiable tenant identity, ambiguous ownership, incomplete lineage, replay boundary violations, unverifiable evidence ownership, compromised ledgers, governance or certification contamination, namespace violations, hidden dependencies, nondeterminism, replay divergence, hash failures, and recording failures.
- Authenticated APIs under `/api/tenant-isolation-validator/*`.

## API Surface

- `GET /api/tenant-isolation-validator/contract`
- `POST /api/tenant-isolation-validator/validate`
- `POST /api/tenant-isolation-validator/ownership`
- `POST /api/tenant-isolation-validator/data`
- `POST /api/tenant-isolation-validator/recommendations`
- `POST /api/tenant-isolation-validator/replay-isolation`
- `POST /api/tenant-isolation-validator/evidence`
- `POST /api/tenant-isolation-validator/ledgers`
- `POST /api/tenant-isolation-validator/governance`
- `POST /api/tenant-isolation-validator/certification`
- `POST /api/tenant-isolation-validator/leakage`
- `POST /api/tenant-isolation-validator/ledger`
- `POST /api/tenant-isolation-validator/replay`
- `GET|POST /api/tenant-isolation-validator/inspect`

## Validation States

- `ISOLATED`
- `ISOLATED_WITH_REVIEW`
- `REQUIRES_GOVERNANCE_REVIEW`
- `ISOLATION_CONFLICT`
- `RESTRICTED`
- `REJECTED`
- `FAIL_CLOSED`

## Certification Notes

- Tenant isolation is architectural, not discretionary.
- Cross-tenant learning, optimization, replay, evidence, governance, certification, policy, and authority sharing are unsupported.
- Any confirmed cross-tenant influence is rejected.
- Replay compares deterministic validation and integrity hashes.
