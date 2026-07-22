# Phase 10.5.4 - Mission Strategy Comparison Engine

## Preview

The Mission Strategy Comparison Engine is the deterministic comparison layer for Phase 10.5 Strategy Evolution. It compares strategies only across missions that satisfy similarity thresholds, ranks their relative performance, and classifies strategies as best-performing, weakest, reusable, mission-specific, or obsolete.

## Tightened Contract

- Comparisons are advisory-only and never mutate strategy, generate proposals, or execute remediation.
- Only `IDENTICAL` and `HIGH` mission similarity support certified comparison. `MODERATE`, `LOW`, and `NONE` fail closed.
- Every comparison must include outcome, pattern, evidence, governance, and replay lineage.
- Rankings and classifications must be deterministic for identical inputs.
- Replay validation, tenant isolation, registry immutability, and integrity hashes are certification gates.
- Cross-tenant, replay-failed, evidence-incomplete, governance-missing, nondeterministic, and hash-mismatched comparisons are rejected.

## Implemented Surface

- `GET /mission-strategy-comparison-engine/contract`
- `POST /mission-strategy-comparison-engine/compare`
- `POST /mission-strategy-comparison-engine/comparisons`
- `POST /mission-strategy-comparison-engine/similarity`
- `POST /mission-strategy-comparison-engine/ranking`
- `POST /mission-strategy-comparison-engine/classification`
- `POST /mission-strategy-comparison-engine/evidence`
- `POST /mission-strategy-comparison-engine/governance`
- `POST /mission-strategy-comparison-engine/replay`
- `POST /mission-strategy-comparison-engine/registry`
- `POST /mission-strategy-comparison-engine/inspect`

## Exit Criteria Mapping

- Deterministic strategy comparisons and stable rankings are covered by unit tests.
- Similarity threshold enforcement rejects unrelated missions.
- Outcome, operator, governance, risk, confidence, evidence, and replay dimensions are represented in typed records.
- Best, weakest, reusable, mission-specific, and obsolete classifications are available as deterministic scenarios.
- Registry entries are immutable and append-only.
- Advisory-only behavior is enforced at result and record level.
