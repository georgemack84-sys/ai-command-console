# EdgeBook Phase 1.1 Source Registry

## Phase Goal

Phase 1.1 defines which sources are allowed to provide future market observations.

This phase controls source legitimacy only. It does not create betting recommendations, picks, predictions, confidence scoring, edge scoring, expected value calculations, sportsbook ranking, betting advice, or auto-wagering behavior.

## Registry Object

`SourceRegistryObject` contains:

- `source_id`
- `source_name`
- `source_type`
- `trust_level`
- `status`
- `owner_id`
- `tenant_id`
- `created_at`
- `version`

## Source Types

Allowed source types are:

- `SPORTSBOOK`
- `API`
- `MANUAL_INPUT`

Unknown or empty source types are rejected.

## Trust Levels

Allowed trust levels are:

- `HIGH`
- `MEDIUM`
- `LOW`
- `UNVERIFIED`

`UNVERIFIED` sources may be registered, but future observation use remains subject to explicit guard rules.

## Source Statuses

Allowed statuses are:

- `ACTIVE`
- `DISABLED`
- `PENDING`
- `BLOCKED`

Only `ACTIVE` sources are allowed for observation eligibility. `DISABLED`, `BLOCKED`, and `PENDING` sources are blocked or restricted.

## Ownership Rules

Every source requires ownership metadata:

- `source_id`
- `owner_id`
- `tenant_id`
- `ownership_hash`
- `created_at`
- `version`

Ownership is deterministic and must not be inherited silently. Anonymous and ownerless sources are invalid.

## Validation Flow

```text
SOURCE RECEIVED
  -> SOURCE TYPE VALID?
  -> STATUS VALID?
  -> OWNERSHIP PRESENT?
  -> DUPLICATE CHECK
  -> REGISTER
```

Failure flow:

```text
BLOCK
LOG
REJECT
```

## Blocked Conditions

The registry rejects:

- unknown source types
- invalid trust levels
- invalid statuses
- missing `source_id`
- missing `source_name`
- missing `owner_id`
- missing `tenant_id`
- invalid `created_at`
- invalid `version`
- duplicate `source_id`
- anonymous sources
- missing or non-deterministic ownership

Observation guards block:

- unknown sources
- disabled sources
- blocked sources
- pending sources
- anonymous sources
- ownerless sources

## Event Types

Registry event types are:

- `SOURCE_REGISTERED`
- `SOURCE_BLOCKED`
- `SOURCE_DISABLED`
- `SOURCE_REJECTED`
- `OWNERSHIP_VALIDATED`
- `OWNERSHIP_FAILED`
- `DUPLICATE_SOURCE_REJECTED`

Events are append-only, timestamped, replayable, and do not trigger betting actions.

## Exit Criteria

Phase 1.1 is complete when the deterministic source registry, validation, ownership metadata, authorization guards, registry events, docs, and tests exist, and when unknown, disabled, blocked, anonymous, duplicate, and ownerless sources are rejected or blocked from observation.
