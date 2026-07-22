# Phase 9.6.5 - Tradeoff Explanation Generator

## Preview

Phase 9.6.5 adds the deterministic explainability layer for conflict arbitration. It turns advisory arbitration outcomes into complete, operator-readable tradeoff explanations without altering outcomes or introducing new evidence.

## Tightened Scope

- Explanations are generated from arbitration records and remain advisory-only.
- Mandatory sections are fixed and ordered: Executive Summary, Conflict Overview, Evidence Analysis, Risk Assessment, Confidence Assessment, Governance Analysis, Constitutional Analysis, Mission Analysis, Forecast Analysis, Recovery Analysis, Final Arbitration Outcome.
- Governance and constitutional reasoning are always present and appear before mission, forecast, recovery, or optimization-oriented analysis.
- Supporting evidence, rejected evidence, selected decisions, rejected decisions, tradeoffs, replay, lineage, and integrity are explicit.
- Incomplete explanations fail closed and are not published.

## Implemented Surface

- `generateTradeoffExplanation` creates deterministic tradeoff records for one arbitration.
- `generateDecisionComparisonReport` emits the operator/auditor comparison report.
- `generateTradeoffExplanations` processes an arbitration result, validates explanations, and writes immutable tradeoff ledger records.
- `validateTradeoffExplanation` rejects missing evidence, omitted rejected evidence, missing governance or constitutional reasoning, missing mandatory sections, replay gaps, integrity drift, advisory-only violations, and tenant leakage.
- `replayTradeoffExplanations` reconstructs explanation, report, and ledger replay hashes.
- `buildTradeoffExplanationObservability` reports explanation, evidence, governance, constitutional, risk, confidence, forecast, recovery, replay, validation, and integrity metrics.

## Exit Criteria Coverage

- Every arbitration receives a complete deterministic explanation.
- No evaluated alternative, accepted tradeoff, rejected decision, or rejected evidence disappears from the explanation.
- All explanations use stable wording templates and canonical section ordering.
- Tradeoff ledger records are immutable, replayable, and hash protected.
- Governance and constitutional reasoning are explicit and prioritized.
- Fail-closed behavior prevents incomplete or misleading operator explanations.
