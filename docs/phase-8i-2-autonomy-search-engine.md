# Phase 8I.2 - Autonomy Search Engine

The Autonomy Search Engine provides deterministic, read-only discovery across Controlled Autonomy history. It searches certified autonomy subsystems through the Phase 8I.1 Autonomy Query Contract and returns replay-compatible, audit-backed results.

## Delivered Capabilities

- Immutable search index records for planning, execution, delegation, orchestration, supervision, governance, intervention, replay, integrity, and boundary domains.
- Canonical filter evaluation order: Tenant, Mission, Authorization, Record Type, Time Range, Execution State, Policy, Confidence, Health, Remaining Filters.
- Stable result ordering by `tenant_id`, `mission_id`, `timestamp`, `autonomy_event_sequence`, and `record_id`.
- Deterministic search execution, replay support, result hashing, audit records, and operator-facing summaries.
- Authorization, tenant isolation, mission scope, replay reference, lineage reference, policy, and constitutional failure handling.
- Strict read-only behavior with mutation attempts represented as index corruption failures.

## API Surface

- `GET /api/autonomy-search-engine/contract`
- `POST /api/autonomy-search-engine/search`
- `POST /api/autonomy-search-engine/validate`
- `POST /api/autonomy-search-engine/hash`
- `POST /api/autonomy-search-engine/records`
- `GET|POST /api/autonomy-search-engine/inspect`

The engine may inspect, filter, search, correlate, reconstruct, and summarize. It never modifies plans, execution, lineage, replay, governance evidence, integrity records, workflows, or interventions.
