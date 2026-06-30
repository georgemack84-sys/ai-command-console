# Phase 7J.1 Governance Query Contract

Phase 7J.1 defines the deterministic contract governing every Governance Intelligence query. It standardizes immutable query identity, authorization, tenant scope, replay references, lineage references, filters, normalization, validation, and audit records.

## Surface

- Types: `types/governance-query-contract.ts`
- Service: `services/governance-query-contract/index.ts`
- API: `app/api/governance-query-contract/*`
- Tests: `tests/unit/governance-query-contract/governanceQueryContract.test.ts`

## Contract Guarantees

- Deterministic query identity and query hash
- Tenant and mission scoping
- Supported query type and target registries
- Immutable filters
- Governance, authority, lineage, and replay scopes
- Read-only authorization
- Deterministic ordering
- Version-aware normalization
- Immutable audit records

## API

- `GET /api/governance-query-contract/contract`
- `POST /api/governance-query-contract/create`
- `POST /api/governance-query-contract/validate`
- `POST /api/governance-query-contract/hash`
- `POST /api/governance-query-contract/audit`
- `GET|POST /api/governance-query-contract/inspect`

All routes require workspace membership and return the standard API response envelope.

## Failure States

The validator rejects invalid structure, invalid scope, invalid replay or lineage references, unauthorized access, tenant isolation violations, constitutional violations, unsupported queries, and missing deterministic validation requirements.
