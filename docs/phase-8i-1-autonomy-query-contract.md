# Phase 8I.1 - Autonomy Query Contract

The Autonomy Query Contract defines the immutable, deterministic, read-only interface for inspecting Controlled Autonomy history in Mission Control.

## Delivered Capabilities

- Immutable autonomy query schema with tenant, mission, operator, type, scope, target, filters, replay, lineage, and authorization metadata.
- Canonical query type registry for plan, execution, delegation, supervision, replay, intervention, policy, historical reconstruction, lineage, and cross-reference queries.
- Deterministic normalization and hashing for replay-compatible queries.
- Tenant-scoped, mission-scoped, governance-aware, constitutionally validated authorization.
- Read-only enforcement that rejects execution or hidden-state access.
- Stable ordering rules independent of storage, cache, runtime, or network behavior.
- Append-only query audit records with result hash, replay reference, lineage reference, and authorization result.

## API Surface

- `GET /api/autonomy-query-contract/contract`
- `POST /api/autonomy-query-contract/create`
- `POST /api/autonomy-query-contract/validate`
- `POST /api/autonomy-query-contract/hash`
- `POST /api/autonomy-query-contract/audit`
- `GET|POST /api/autonomy-query-contract/inspect`

## Deterministic Ordering

Results must be ordered by:

1. `tenant_id`
2. `mission_id`
3. `timestamp`
4. `event_sequence`
5. `immutable_record_id`

The contract permits inspection, search, reconstruction, explanation, and cross-reference discovery only. It never permits autonomous execution or mutation of history.
