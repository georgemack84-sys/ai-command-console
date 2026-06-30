# EdgeBook Phase 1.3 Ownership Binding

## Phase Goal

Phase 1.3 attaches deterministic, immutable ownership to every market observation.

This phase is ownership-only. It does not create betting recommendations, picks, predictions, confidence scoring, edge scoring, expected value calculations, sportsbook ranking, betting advice, auto-wagering, or market intelligence logic.

## Ownership Contract

`OwnershipContract` contains:

- `ownership_hash`
- `owner_id`
- `tenant_id`
- `source_id`
- `market_id`
- `timestamp`
- `version`

All fields are mandatory. Null, undefined, and empty-string fields are rejected.

## Ownership Hash Generator

The ownership hash is generated from:

- `owner_id`
- `tenant_id`
- `source_id`
- `market_id`
- `timestamp`
- `version`

Hash input is canonicalized with stable field ordering. The same input always creates the same hash, and changed input creates a different hash. Manual hash mismatch is rejected.

## Owner Validation

`owner_id` must be explicit. The ownership layer rejects:

- null
- undefined
- empty string
- `anonymous`
- `unknown`
- `system-inherited`

## Tenant Validation

`tenant_id` must be explicit. The ownership layer rejects:

- null
- undefined
- empty string
- `shared`
- `global`
- `unknown`

Cross-tenant ownership is prohibited.

## Source Ownership Binding

Ownership binds to a registered active source. Source binding checks:

- source exists
- source is registered
- source is active
- source `owner_id` matches ownership `owner_id`
- source `tenant_id` matches ownership `tenant_id`

Unknown, disabled, blocked, owner-mismatched, and tenant-mismatched sources are rejected.

## Market Ownership Binding

Ownership binds to one observed market. Market binding checks:

- `market_id` exists
- ownership `market_id` matches observation `market_id`
- ownership hash includes the market ID

Generic ownership not tied to a market is rejected.

## Immutability Rules

Ownership records are append-only. After creation, these fields cannot change:

- `ownership_hash`
- `owner_id`
- `tenant_id`
- `source_id`
- `market_id`
- `timestamp`
- `version`

Silent inheritance and replacement are prohibited.

## Validation Flow

```text
OBSERVATION RECEIVED
  -> OWNERSHIP PRESENT?
  -> OWNER VALID?
  -> TENANT VALID?
  -> SOURCE VALID?
  -> SOURCE OWNERSHIP MATCHES?
  -> MARKET ID PRESENT?
  -> HASH REPRODUCIBLE?
  -> BIND OWNERSHIP
```

Failure flow:

```text
BLOCK
LOG FAILURE
REJECT OBSERVATION
```

## Event Types

- `OWNERSHIP_CREATED`
- `OWNERSHIP_VALIDATED`
- `OWNERSHIP_BOUND_TO_SOURCE`
- `OWNERSHIP_BOUND_TO_MARKET`
- `OWNERSHIP_REJECTED`
- `OWNERSHIP_MUTATION_BLOCKED`
- `OWNERSHIP_HASH_MISMATCH`
- `OWNER_INVALID`
- `TENANT_INVALID`
- `SOURCE_OWNERSHIP_MISMATCH`
- `MARKET_OWNERSHIP_MISMATCH`

Events are append-only, timestamped, replayable, and informational only.

## Exit Criteria

Phase 1.3 is complete when deterministic ownership contracts, hash generation, owner and tenant validators, source and market binding, immutability guards, events, docs, and tests exist, and nullable, missing, mutable, inherited, mismatched, unknown-source, disabled-source, and blocked-source ownership is rejected.
