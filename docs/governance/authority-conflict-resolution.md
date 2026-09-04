# Authority Conflict Resolution — Phase 6, Part VI

`ConservativeAuthorityConflictDetector` consumes an already-detected knowledge relationship plus the Part V precedence assessment. It returns one explicit outcome: `NO_CONFLICT`, `COEXIST`, `SUPERSEDE_EXISTING`, `REJECT_INCOMING`, `REQUIRE_VALIDATION`, `REQUIRE_HUMAN_REVIEW`, or `ESCALATE`.

The detector rejects an agent claim that contradicts scoped human authority and a human preference that contradicts an approved policy. A verified external claim challenging an approved reference requires validation rather than being silently rejected. Uncertain semantic relationships also require validation.

`SUPERSEDE_EXISTING` is a candidate outcome only. This detector performs no write, replacement, revocation, or action authorization.
