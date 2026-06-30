# EdgeBook Phase 1.2 Market Observation Schema

## Phase Goal

Phase 1.2 defines one deterministic structure for market observations before future phases can verify, store, compare, or replay them.

This phase is schema-only. It does not create recommendations, picks, predictions, confidence scoring, edge scoring, expected value calculations, sportsbook ranking, betting advice, auto-wagering, or market intelligence logic.

## Market Observation Object

`MarketObservation` contains:

- `market_id`
- `sport`
- `league`
- `event_id`
- `market_type`
- `market_subtype`
- `participant`
- `line_value`
- `odds_value`
- `timestamp`
- `source_id`
- `ownership_hash`
- `schema_version`
- `raw_values`

## Supported Market Types

- `SPREAD`
- `MONEYLINE`
- `TOTALS`
- `PLAYER_PROP`
- `ALTERNATE_LINE`

Unknown or empty market types are invalid.

## Raw Value Preservation

`RawMarketValues` preserves:

- `raw_payload`
- `raw_line_value`
- `raw_odds_value`
- `raw_participant`
- `raw_market_name`
- `received_at`

Raw values are mandatory. Normalized fields must not overwrite raw fields, and hidden transformation is prohibited.

## Schema Versioning

The current supported version is `1.2.0`.

`schema_version` is mandatory. Unsupported versions are rejected, and version changes must be explicit.

## Required Fields

Required normalized fields are:

- `market_id`
- `sport`
- `league`
- `event_id`
- `market_type`
- `market_subtype`
- `participant`
- `odds_value`
- `timestamp`
- `source_id`
- `ownership_hash`
- `schema_version`
- `raw_values`
- `raw_values.raw_payload`
- `raw_values.received_at`

## Type-Specific Rules

`SPREAD` requires a participant, numeric `line_value`, numeric `odds_value`, and raw values.

`MONEYLINE` requires a participant, `line_value = null`, numeric `odds_value`, and raw values.

`TOTALS` requires participant `OVER` or `UNDER`, numeric `line_value`, numeric `odds_value`, and raw values.

`PLAYER_PROP` requires a player identifier, `market_subtype`, numeric `line_value`, numeric `odds_value`, and raw values.

`ALTERNATE_LINE` requires participant, `market_subtype`, numeric `line_value`, numeric `odds_value`, and raw values. `parent_market_id` may be supplied later.

## Prohibited Fields

Phase 1.2 rejects:

- `edge_score`
- `confidence_score`
- `recommendation`
- `pick`
- `expected_value`
- `wager_instruction`
- `bet_advice`
- `projected_winner`

## Validation Flow

```text
OBSERVATION RECEIVED
  -> REQUIRED FIELDS PRESENT?
  -> MARKET TYPE VALID?
  -> SCHEMA VERSION SUPPORTED?
  -> RAW VALUES PRESERVED?
  -> TYPE-SPECIFIC RULES SATISFIED?
  -> STRUCTURE VALID
```

Rejected observations are structural failures only. They do not trigger betting, recommendation, prediction, or scoring actions.

## Exit Criteria

Phase 1.2 is complete when all supported market observation schemas exist, required fields cannot be missing, raw values are preserved, unsupported versions and unknown market types are rejected, prohibited intelligence fields are rejected, and tests pass.
