# Phase 9.6.3 - Conflict Classification Engine

## Preview

Phase 9.6.3 classifies detected conflicts into deterministic primary and secondary categories, calculates severity, validates governance and constitutional metadata, and prepares operator-visible reports for downstream arbitration.

## Tightened Scope

- The engine classifies and reports only; it never resolves conflicts, prioritizes recommendations, overrides governance, suppresses classifications, or mutates decision candidates.
- Category precedence is explicit and deterministic: Constitutional, Governance, Authority, Certification, Tenant Boundary, Mission Objective, Recovery, Resource, Timing, Forecast, Risk, Confidence, Evidence, Recommendation.
- Prompt terms `Mission` and `Tenant` are normalized to the repository’s canonical `Mission Objective` and `Tenant Boundary` categories.
- Blocking severity is assigned for constitutional violations, tenant isolation failures, authority or governance bypass, certification blockers, and replay integrity failures.
- Classifications fail closed before arbitration when category, severity, governance, constitutional, replay, tenant, advisory-only, or integrity checks fail.

## Implemented Surface

- `determinePrimaryConflictCategory` selects the authoritative category using the canonical priority table.
- `determineSecondaryConflictCategories` preserves supporting categories without overriding the primary.
- `calculateConflictClassificationSeverity` applies deterministic severity rules.
- `classifyDetectedConflict` emits immutable classification records.
- `generateConflictClassificationReport` creates replayable operator-visible reports.
- `classifyDetectedConflicts` validates, reports, and writes immutable classification ledger records.
- `replayConflictClassification` reconstructs classification output and detects replay drift.
- `buildConflictClassificationObservability` publishes classification metrics by category, severity, validation, replay, and integrity.

## Exit Criteria Coverage

- Every detected conflict receives one deterministic primary category.
- Secondary categories are stable and do not alter primary precedence.
- Severity calculations are reproducible and tied to canonical factors.
- Reports include originating decisions, category, severity, evidence, governance, constitutional evaluation, escalation recommendation, replay, and integrity.
- Governance, constitutional, authority, tenant isolation, advisory-only, replay, and integrity validations are enforced.
- Classification ledger records are immutable and replay-verifiable.
