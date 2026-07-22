# Phase 9.6.2 - Conflict Detection Engine

## Preview

Phase 9.6.2 implements the deterministic scanner and pairwise comparison engine that identifies conflicts between validated decision candidates before arbitration begins.

## Tightened Scope

- The engine detects and records conflicts only; it never resolves, suppresses, prioritizes, or executes decisions.
- Candidate scanning excludes rejected and archived candidates, enforces tenant and mission boundaries, and orders by tenant, mission, priority, and candidate id.
- Pair generation is deterministic and avoids self-comparison, cross-tenant comparison, and cross-mission comparison.
- Detection rules produce explicit signals for duplicate recommendations, incompatible actions, policy contradictions, evidence conflicts, authority overlap, recovery conflicts, timing collisions, forecast divergence, mission objective incompatibility, and certification blockers.
- Every signal is registered through the Phase 9.6.1 Conflict Detection Contract before being written to the detection ledger.

## Implemented Surface

- `scanConflictCandidates` returns deterministic eligible candidate batches.
- `generateCandidateComparisonPairs` creates stable pairwise comparisons.
- `compareCandidatePair` evaluates the supported conflict rules without side effects.
- `detectDecisionCandidateConflicts` validates candidates, deduplicates signals, registers conflicts, writes immutable detection ledger records, and fails closed for invalid inputs.
- `replayConflictDetectionEngine` reconstructs candidate ordering, pairs, signals, conflicts, validations, ledger records, and replay hash.
- `buildConflictDetectionEngineObservability` reports scanned candidates, generated pairs, comparisons, conflicts by category, rule rates, replay success, validation failures, and integrity failures.

## Exit Criteria Coverage

- Supported conflict categories are detected deterministically.
- Candidate ordering and pair generation are stable for identical inputs.
- Duplicate recommendations are detected and conflict ids are deduplicated.
- Conflicts are validated through the Phase 9.6.1 contract before ledger persistence.
- Replay reconstructs the same detection outputs and fails closed on mismatch.
- Governance, constitutional, authority, replay, integrity, advisory-only behavior, and tenant isolation are enforced by registration and validation.
