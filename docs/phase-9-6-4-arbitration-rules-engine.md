# Phase 9.6.4 - Arbitration Rules Engine

## Preview

Phase 9.6.4 introduces deterministic arbitration rule evaluation for classified conflicts. It produces advisory arbitration outcomes, rationale, tradeoff metadata, and immutable ledger records without executing decisions.

## Tightened Scope

- The engine applies only certified rules in the fixed priority order: Constitution, Governance, Authority, Safety, Mission Success, Forecast, Optimization.
- Constitutional rejection terminates lower-priority evaluation.
- Governance and authority escalation cannot be overridden by safety, mission, forecast, or optimization rules.
- Certification, simulation, operator, and governance requirements are represented as explicit outcomes rather than hidden decision selection.
- The engine remains advisory-only; selected or rejected candidate refs are metadata for downstream review, not execution authority.

## Implemented Surface

- `createArbitrationRules` loads immutable deterministic rule definitions.
- `arbitrateClassification` evaluates one classified conflict through the canonical hierarchy.
- `arbitrateClassifiedConflicts` evaluates a classification result, validates outcomes, and writes immutable arbitration ledger records.
- `validateArbitration` rejects unsupported outcomes, bad rule ordering, missing governance or constitutional metadata, replay gaps, integrity drift, and advisory-only violations.
- `replayArbitrationRulesEngine` reconstructs rule execution, outcomes, ledgers, and replay hash.
- `buildArbitrationObservability` publishes outcome, escalation, replay, validation, and integrity metrics.

## Exit Criteria Coverage

- Rule execution is deterministic and integrity protected.
- Priority hierarchy is enforced without lower-priority override.
- Constitutional failures produce immediate `REJECT`.
- Governance and authority precedence are explicit.
- Risk, confidence, mission, recovery/certification, simulation, and operator authority conditions map to approved outcomes.
- Arbitration records include candidates, rules applied, priority path, outcome, selected/rejected refs, escalation, summaries, replay, lineage, tradeoffs, and integrity hash.
- Replay reconstructs identical arbitration outcomes and fails closed on mismatch.
