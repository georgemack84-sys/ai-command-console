# EdgeBook Phase 1.6 Basic Change Detection

## Phase Goal

Phase 1.6 measures changes between verified market observations.

This phase is measurement-only. It does not create betting recommendations, picks, predictions, confidence scoring, edge scoring, expected value calculations, implied probability conversion, sportsbook ranking, betting advice, sharp action interpretation, auto-wagering, market intelligence logic, or market movement interpretation.

## Watched Movement Types

- spread movement
- totals movement
- moneyline movement
- odds movement
- player prop movement
- alternate line movement

## Market Change Record

`MarketChangeRecord` contains:

- `change_id`
- `market_id`
- `source_id`
- `ownership_hash`
- `market_type`
- `previous_value`
- `new_value`
- `movement_size`
- `movement_direction`
- `timestamp`
- `version`

## Movement Direction Rules

- new value greater than previous value: `UP`
- new value less than previous value: `DOWN`
- same value: `UNCHANGED`
- comparison unavailable: `UNKNOWN`

## Change Detection Statuses

- `CHANGE_DETECTED`
- `NO_CHANGE`
- `NO_BASELINE`
- `COMPARISON_FAILED`

## Comparison Key

Comparison keys are deterministic and include:

- `source_id`
- `market_id`
- `market_type`
- `market_subtype`
- `participant`

Optional supporting fields include `event_id`, `league`, and `sport`.

## Movement Calculation

`movement_size = abs(new_value - previous_value)`

No probability conversion, near-duplicate interpretation, value classification, or prediction is allowed.

## Comparator Behavior

Comparators measure numeric movement only:

- spread: `line_value`
- totals: `line_value`
- moneyline: `odds_value`
- odds movement: `odds_value`
- player prop: `line_value`
- alternate line: `line_value`

## Silent Failure Visibility

Every failed comparison creates a replayable `ChangeDetectionFailure`. Silent failure is prohibited.

## Event Types

- `CHANGE_DETECTION_STARTED`
- `BASELINE_FOUND`
- `NO_BASELINE_FOUND`
- `MARKET_CHANGE_DETECTED`
- `NO_MARKET_CHANGE`
- `CHANGE_COMPARISON_FAILED`
- `CHANGE_RECORD_CREATED`
- `CHANGE_FAILURE_RECORDED`

## Prohibited Outputs

The boundary guard rejects:

- `prediction`
- `recommendation`
- `pick`
- `edge_score`
- `confidence_score`
- `expected_value`
- `wager_instruction`
- `bet_advice`
- `projected_winner`
- `implied_probability`
- `sharp_action`

## Exit Criteria

Phase 1.6 is complete when all supported market movements are measurable, movement size and direction are deterministic, comparison keys exist, changes and failures are replayable, silent failures are visible, and tests pass without predictive or betting-advice outputs.
