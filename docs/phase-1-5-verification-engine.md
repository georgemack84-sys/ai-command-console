# EdgeBook Phase 1.5 Verification Engine

## Phase Goal

Phase 1.5 prevents invalid observations from entering the raw observation store.

This phase is verification-only. It does not create betting recommendations, picks, predictions, confidence scoring, edge scoring, expected value calculations, sportsbook ranking, betting advice, auto-wagering, market movement interpretation, or market intelligence logic.

## Verification Result

`VerificationResult` contains:

- `verification_id`
- `observation_id`
- `market_id`
- `source_id`
- `ownership_hash`
- `status`
- `failure_reason`
- `failed_stage`
- `timestamp`
- `version`

Allowed statuses are `VERIFIED`, `BLOCKED`, and `FAILED`.

## Verification Stages

- `SOURCE_VALIDATION`
- `SCHEMA_VALIDATION`
- `OWNERSHIP_VALIDATION`
- `TIMESTAMP_VALIDATION`
- `REQUIRED_FIELD_VALIDATION`
- `DUPLICATE_CONTROL`
- `STORE_AUTHORIZATION`

## Source Verification

Source verification requires a registered `ACTIVE` source with ownership metadata. Unknown, disabled, blocked, and ownerless sources fail.

## Schema Verification

Schema verification uses the Phase 1.2 market observation schema. Unknown market types, unsupported schema versions, missing raw values, and type-specific rule failures are blocked.

## Timestamp Verification

Observation timestamps and `raw_values.received_at` must exist and be valid timestamps.

## Ownership Verification

Ownership verification uses the Phase 1.3 ownership contract. Ownership hash, owner, tenant, source, market, nullability, inheritance markers, and reproducible hash matching are enforced.

## Required Field Verification

Required observation fields are checked deterministically. Missing, null, or empty required fields block verification.

## Duplicate Control

Duplicate control uses an exact deterministic key:

- `source_id`
- `market_id`
- `market_type`
- `market_subtype`
- `participant`
- `line_value`
- `odds_value`
- `timestamp`
- `ownership_hash`

Exact duplicates are observable and blocked. Near-duplicate interpretation is prohibited.

## Store Authorization

Only `VERIFIED` observations may append to the raw observation store as valid. `BLOCKED`, `FAILED`, unverified, invalid-source, invalid-schema, invalid-ownership, and uncontrolled duplicate observations are denied.

## Verification Flow

```text
SOURCE VALID?
  -> SCHEMA VALID?
  -> TIMESTAMP VALID?
  -> OWNERSHIP VALID?
  -> REQUIRED FIELDS COMPLETE?
  -> DUPLICATE CONTROL PASSED?
  -> STORE OBSERVATION
```

Any `NO` path blocks the observation and records a failure.

## Event Types

- `VERIFICATION_STARTED`
- `SOURCE_VERIFIED`
- `SOURCE_VERIFICATION_FAILED`
- `SCHEMA_VERIFIED`
- `SCHEMA_VERIFICATION_FAILED`
- `TIMESTAMP_VERIFIED`
- `TIMESTAMP_VERIFICATION_FAILED`
- `OWNERSHIP_VERIFIED`
- `OWNERSHIP_VERIFICATION_FAILED`
- `DUPLICATE_DETECTED`
- `OBSERVATION_VERIFIED`
- `OBSERVATION_BLOCKED`
- `VERIFICATION_FAILURE_RECORDED`
- `STORE_AUTHORIZATION_GRANTED`
- `STORE_AUTHORIZATION_DENIED`

Events are append-only, timestamped, replayable, and informational only.

## Exit Criteria

Phase 1.5 is complete when source, schema, timestamp, ownership, required field, duplicate, store authorization, failure recording, and event layers exist; invalid observations are blocked; failures are observable; verification results are reproducible; and tests pass.
