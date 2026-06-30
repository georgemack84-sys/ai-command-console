# EdgeBook Phase 1.7 Responsible Gambling Guardrails

## Phase Goal

Phase 1.7 ensures EdgeBook remains informational only.

This phase is guardrails-only. It does not create betting recommendations, picks, predictions, confidence scoring, edge scoring, expected value calculations, wager automation, bankroll optimization, sportsbook ranking, bet slip generation, or betting advice logic.

## Allowed Language

Allowed examples:

- `Market movement detected.`
- `Observation recorded.`
- `Source verified.`
- `No betting recommendation generated.`
- `Risk status: informational only.`

## Blocked Language

Blocked language includes:

- pick language such as `bet this now`, `take this line`, `pick of the day`, and `best bet`
- guarantee language such as `guaranteed win`, `lock of the day`, `safe profit`, `risk free`, and `easy money`
- misleading confidence language such as `max confidence`, `100% confidence`, and `can't miss`
- loss chasing language such as `recover losses`, `double down`, `all in`, and `martingale`
- automation language such as `auto wager`, `create bet slip`, and `sportsbook automation`

## Disclaimers

Required disclaimer:

`This is informational market observation only. It is not betting advice, a prediction, or a recommendation.`

Short disclaimer:

`Informational only. No betting recommendation generated.`

Every allowed market output receives a deterministic disclaimer.

## Warnings

Default warning:

`Risk status: informational only. No betting recommendation generated.`

Expanded warning:

`Market observations can change quickly and do not predict outcomes. Only risk money you can afford to lose.`

## Prohibited Outputs

The guardrail layer rejects fields such as:

- `recommendation`
- `pick`
- `bet_advice`
- `wager_instruction`
- `edge_score`
- `confidence_score`
- `expected_value`
- `projected_winner`
- `stake_size`
- `unit_size`
- `bankroll_allocation`
- `lock_rating`
- `sharp_action`

Allowed fields include observation, verification, source, movement, informational, and risk status fields.

## Automation Bans

EdgeBook must not place bets, create bet slips, confirm stakes, submit wagers, execute sportsbook transactions, or automate sportsbook actions.

## Event Types

- `GUARDRAIL_CHECK_STARTED`
- `INFORMATIONAL_OUTPUT_ALLOWED`
- `PICK_LANGUAGE_BLOCKED`
- `GUARANTEE_LANGUAGE_BLOCKED`
- `BET_AUTOMATION_BLOCKED`
- `CHASING_LOSSES_BLOCKED`
- `MISLEADING_CONFIDENCE_BLOCKED`
- `DISCLAIMER_APPLIED`
- `PREMATURE_RECOMMENDATION_BLOCKED`

Events are append-only, replayable, timestamped, and do not trigger betting actions.

## Exit Criteria

Phase 1.7 is complete when no-picks enforcement, guarantee blocking, risk warnings, bankroll safety language, restricted output fields, disclaimers, output classification, automation blocking, loss-chasing prevention, misleading-confidence blocking, events, docs, and tests exist.
