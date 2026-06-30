# Phase 7L.5 - Isolation Validation

Phase 7L.5 adds the Isolation Validation layer for the Mission Control certification suite. It certifies that Governance Intelligence remains multi-tenant safe by isolating tenants, missions, governance contexts, replay environments, recommendations, evidence, and visibility surfaces.

## Runtime Contract

- Service: `services/governance-isolation-validation`
- Types: `types/governance-isolation-validation.ts`
- API base: `/api/governance-isolation-validation`
- Schema: `governance-isolation-validation/v7L.5`
- Phase: `7L.5`

The validator is read-only and cannot mutate tenant data, change ownership, bypass authorization, expose protected governance information, or execute governance or operational actions.

## Validation Domains

- `TENANT_BOUNDARY`: verifies tenant identifiers, tenant ownership, tenant-scoped resources, and immutable tenant identity.
- `GOVERNANCE_SEPARATION`: verifies isolated governance state, policy graphs, lineage, compliance, risk, escalation, and certification records.
- `REPLAY_ISOLATION`: verifies replay sessions, replay evidence, replay timelines, reconstruction, and replay outputs remain scoped.
- `RECOMMENDATION_ISOLATION`: verifies recommendation ownership, confidence, evidence, lineage, storage, and retrieval.
- `EVIDENCE_ISOLATION`: verifies evidence ownership, references, lineage, integrity, storage, and reconstruction.
- `VISIBILITY_CONTROL`: verifies dashboards, search, lineage views, recommendation visibility, and evidence inspection remain authorized.

## API Surfaces

- `GET /api/governance-isolation-validation/contract`
- `GET /api/governance-isolation-validation/report`
- `GET /api/governance-isolation-validation/run`
- `GET /api/governance-isolation-validation/checks`
- `GET /api/governance-isolation-validation/result`
- `GET /api/governance-isolation-validation/timeline`
- `GET /api/governance-isolation-validation/evidence`
- `GET /api/governance-isolation-validation/ledger`
- `GET /api/governance-isolation-validation/observability`
- `GET /api/governance-isolation-validation/hash`

Each endpoint supports optional `tenantId`, `missionId`, `validatorId`, and `scenario` query parameters.

## Rejection Coverage

The validator rejects tenant mismatches, cross-tenant record references, unauthorized tenant access, shared governance state, policy contamination, governance state leakage, replay data leakage, cross-tenant replay reconstruction, shared replay history, shared recommendations, recommendation visibility leaks, recommendation ownership mismatches, shared evidence, unauthorized evidence references, evidence leakage, unauthorized dashboards, unauthorized search results, unauthorized lineage views, unauthorized recommendation visibility, and unauthorized evidence inspection.

Every violation fails closed and is recorded in an append-only isolation validation truth-ledger record.
