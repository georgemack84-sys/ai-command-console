# EdgeBook Phase 1.0 Core System Skeleton

## Phase Goal

EdgeBook Phase 1.0 creates the safe, structured, testable base for a responsible sports market observation system.

This phase does not make EdgeBook smart. It does not create betting recommendations, picks, predictions, confidence scores, edge scores, expected value calculations, betting advice, or auto-wagering behavior.

## Folder Structure

```text
src/
  core/
    config/
    types/
    validation/
    events/
    errors/
    guards/
  modules/
    sources/
    markets/
    ownership/
    observations/
    verification/
    responsible-gambling/
  tests/
    unit/
    integration/
    fixtures/
  index.ts
```

Repository-level executable tests remain in `tests/unit` to match the existing Vitest configuration.

## Safe Defaults

The Phase 1.0 config defaults are:

- `appName = "EdgeBook"`
- `phase = "1.0"`
- `intelligenceEnabled = false`
- `recommendationsEnabled = false`
- `gamblingAdviceEnabled = false`
- `eventLoggingEnabled = true`
- `validationStrictMode = true`

The config layer fails closed if intelligence, recommendations, or gambling advice are enabled during Phase 1.0.

## Blocked Logic

Phase 1.0 blocks:

- betting recommendations
- picks
- predictions
- confidence scoring
- edge scoring
- expected value calculations
- auto-wagering
- betting advice
- market intelligence logic

## Validation Utilities

The core validation layer provides deterministic helpers:

- `isDefined`
- `isNonEmptyString`
- `isValidTimestamp`
- `isValidVersion`
- `assertRequiredField`
- `createValidationResult`

Validation results include status, reason, optional field, and timestamp. Validation helpers do not mutate input.

## Event Utilities

`createEdgeBookEvent` creates informational Phase 1.0 events with:

- `event_id`
- `event_type`
- `severity`
- `message`
- `timestamp`
- `phase`

Blocked event types include `BET_RECOMMENDED`, `PICK_GENERATED`, `EDGE_SCORE_CREATED`, `CONFIDENCE_RANKED`, and `AUTO_WAGER_TRIGGERED`.

## Phase Boundary Rules

The Phase 1.0 guard rejects:

- `GENERATE_PICK`
- `RANK_BET`
- `CALCULATE_EDGE`
- `CREATE_RECOMMENDATION`
- `AUTO_WAGER`
- `CREATE_PREDICTION`
- `CALCULATE_EXPECTED_VALUE`

Blocked actions return or throw `PHASE_BOUNDARY_VIOLATION`.

## Exit Criteria

Phase 1.0 is complete when:

- core modules are separated
- shared system types exist
- safe config defaults exist
- validation utilities exist
- event utilities exist
- error utilities exist
- phase boundary guards exist
- placeholder modules expose no intelligence or recommendation logic
- unit tests pass
