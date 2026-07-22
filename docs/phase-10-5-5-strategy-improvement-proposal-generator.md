# Phase 10.5.5 - Strategy Improvement Proposal Generator

## Preview

The Strategy Improvement Proposal Generator is the advisory output layer of the Strategy Evolution Engine. It consolidates validated opportunities, failures, mission strategy comparisons, pattern lineage, outcome evidence, governance references, and replay history into deterministic proposals for downstream simulation, certification, governance review, and operator approval.

## Tightened Contract

- Proposals are advisory-only and never directly mutate strategy.
- Proposal generation is allowed only when upstream opportunity, failure, and comparison intelligence is certified.
- Every proposal requires historical evidence, recurring pattern references, expected benefits, expected risks, governance analysis, constitutional analysis, operator impact, replay references, and a rollback plan.
- Simulation, approval, and certification are mandatory for every generated proposal.
- No proposal may contain hidden reasoning, single-source support, cross-tenant evidence, missing replay lineage, or incomplete governance analysis.
- The registry is immutable and append-only.

## Implemented Surface

- `GET /strategy-improvement-proposal-generator/contract`
- `POST /strategy-improvement-proposal-generator/generate`
- `POST /strategy-improvement-proposal-generator/proposals`
- `POST /strategy-improvement-proposal-generator/priority`
- `POST /strategy-improvement-proposal-generator/recommendation`
- `POST /strategy-improvement-proposal-generator/evidence`
- `POST /strategy-improvement-proposal-generator/governance`
- `POST /strategy-improvement-proposal-generator/replay`
- `POST /strategy-improvement-proposal-generator/registry`
- `POST /strategy-improvement-proposal-generator/inspect`

## Exit Criteria Mapping

- Deterministic proposal generation and prioritization are covered by unit tests.
- Required evidence, risk, benefit, governance, constitutional, operator, replay, and rollback fields are validated.
- Recommendation states support `ADVANCE`, `DEFER`, `REVISE`, and `REJECT`.
- Advisory-only, no strategy mutation, and no direct approval bypass are enforced.
- Integrity hashes and replay hashes are reproducible.
