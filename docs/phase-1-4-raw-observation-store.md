# EdgeBook Phase 1.4 Raw Observation Store

## Phase Goal

Phase 1.4 preserves every exact observed market state in an append-only raw observation store.

This phase is storage-only. It does not create betting recommendations, picks, predictions, confidence scoring, edge scoring, expected value calculations, sportsbook ranking, betting advice, auto-wagering, market movement interpretation, or market intelligence logic.

## Storage Objects

The store appends four replayable record types:

- `RawMarketObservation`
- `OwnershipRecord`
- `SourceReference`
- `ValidationRecord`

## Raw Market Observation

`RawMarketObservation` contains:

- `observation_id`
- `market_id`
- `source_id`
- `ownership_hash`
- `raw_payload`
- `received_at`
- `schema_version`
- `storage_version`

`raw_payload` is mandatory and must be preserved exactly as received. It must not be normalized, cleaned, overwritten, or replaced by transformed data.

## Ownership Record

`OwnershipRecord` contains:

- `ownership_hash`
- `owner_id`
- `tenant_id`
- `source_id`
- `market_id`
- `observation_id`
- `timestamp`
- `version`

It must match the stored observation ownership hash, source ID, market ID, and observation ID.

## Source Reference

`SourceReference` contains a replayable snapshot of the source:

- `source_id`
- `source_name`
- `source_type`
- `trust_level`
- `status`
- `owner_id`
- `tenant_id`
- `referenced_at`
- `version`

The source ID must match the observation source ID.

## Validation Record

`ValidationRecord` contains:

- `validation_id`
- `observation_id`
- `status`
- `reason`
- `validator`
- `timestamp`
- `version`

Allowed statuses are `VALID`, `INVALID`, and `BLOCKED`. Validation history is append-only and cannot be rewritten.

## Append-Only Rules

The store exposes append and read operations only:

- `appendRawObservation`
- `appendOwnershipRecord`
- `appendSourceReference`
- `appendValidationRecord`
- `getObservationById`
- `getObservationHistory`
- `replayObservation`
- `listObservationsByMarket`
- `listObservationsBySource`

There is no update, delete, or replace API. Returned records are cloned so callers cannot mutate history through read results.

## Mutation Blocking

Blocked actions include:

- `UPDATE_RAW_OBSERVATION`
- `DELETE_RAW_OBSERVATION`
- `REPLACE_RAW_PAYLOAD`
- `UPDATE_OWNERSHIP_RECORD`
- `UPDATE_SOURCE_REFERENCE`
- `UPDATE_VALIDATION_RECORD`
- `REWRITE_VALIDATION_RESULT`
- `REWRITE_STORAGE_HISTORY`

## Historical Reconstruction

Replay flow:

```text
OBSERVATION_ID
  -> LOAD RAW OBSERVATION
  -> LOAD OWNERSHIP RECORD
  -> LOAD SOURCE REFERENCE
  -> LOAD VALIDATION RECORD
  -> RECONSTRUCT HISTORICAL STATE
```

Replay is read-only, deterministic, and returns clear failures when required components are missing or mismatched.

## Storage Events

Storage event types are:

- `RAW_OBSERVATION_APPENDED`
- `OWNERSHIP_RECORD_APPENDED`
- `SOURCE_REFERENCE_APPENDED`
- `VALIDATION_RECORD_APPENDED`
- `MUTATION_ATTEMPT_BLOCKED`
- `RAW_PAYLOAD_PRESERVED`
- `REPLAY_REQUESTED`
- `REPLAY_COMPLETED`
- `REPLAY_FAILED`

Events are append-only, timestamped, replayable, and informational only.

## Exit Criteria

Phase 1.4 is complete when raw observations, ownership records, source references, validation records, replay, mutation guards, storage events, docs, and tests exist, and when raw history cannot be updated, deleted, replaced, or rewritten.
