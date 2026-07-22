# Phase 10.5.9 - Strategy Replay & Explainability Engine

## Preview

The Strategy Replay & Explainability Engine is the transparency layer for Strategy Evolution. It reconstructs how a proposal was derived, which outcomes, decisions, recommendations, patterns, evidence, governance reviews, simulations, operator reviews, and lineage references supported it, and why it reached its recommendation.

## Tightened Contract

- Replay requires a certified Strategy Simulation Binding result.
- Every replay record must include outcome, decision, recommendation, pattern, proposal, governance, simulation, operator review, evidence, and lineage references.
- Explanations must be deterministic, human-readable, replayable, and free of hidden reasoning.
- Replay is advisory and explanatory only. It never authorizes adoption or mutates strategy.
- Cross-tenant replay, nondeterministic reconstruction, missing lineage, hidden reasoning, and integrity mismatches fail closed.
- The replay registry is immutable and append-only.

## Implemented Surface

- `GET /strategy-replay-explainability-engine/contract`
- `POST /strategy-replay-explainability-engine/replay`
- `POST /strategy-replay-explainability-engine/records`
- `POST /strategy-replay-explainability-engine/explanation`
- `POST /strategy-replay-explainability-engine/lineage`
- `POST /strategy-replay-explainability-engine/trace`
- `POST /strategy-replay-explainability-engine/evidence`
- `POST /strategy-replay-explainability-engine/governance`
- `POST /strategy-replay-explainability-engine/simulation`
- `POST /strategy-replay-explainability-engine/operator`
- `POST /strategy-replay-explainability-engine/registry`
- `POST /strategy-replay-explainability-engine/inspect`

## Exit Criteria Mapping

- Outcome, decision, recommendation, pattern, proposal, governance, simulation, operator, evidence, and lineage replay are validated.
- Hidden reasoning and nondeterministic replay are explicit fail-closed conditions.
- Replay and explanation hashes are reproducible.
- Tenant isolation and advisory-only behavior are preserved.
