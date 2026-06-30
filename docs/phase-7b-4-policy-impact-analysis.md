# Mission Control Phase 7B.4 - Policy Impact Analysis

## Purpose

Phase 7B.4 answers: what changed because this policy existed?

It converts 7B.1 PolicyAnalysis records, 7B.2 PolicyCorrelation records, and 7B.3 PolicyDependencyGraph snapshots into deterministic, evidence-linked, replayable impact intelligence.

The engine remains advisory-only. It does not create policy, modify policy, enforce policy, resolve conflicts, approve actions, expand authority, or override operators.

## Doctrine

The impact layer enforces:

- evidence-required impact claims
- no unsupported causality
- historical and projected impact separation
- advisory-only behavior
- replay-required outputs
- tenant isolation
- fail-closed validation

Projected and counterfactual analysis must be scenario-bounded and clearly labeled.

## Contract

The canonical record is `PolicyImpactAnalysis`, defined in `types/policy-impact-analysis.ts`.

It includes:

- policy identity and version
- impact scope
- impact category
- impact mode
- affected components
- affected policies
- affected decisions
- affected recommendations
- affected authorities
- affected runtime events
- affected missions
- affected governance actions
- affected certifications
- affected violations
- impact path
- historical timeline
- impact metrics
- confidence score and basis
- source correlation and graph references
- Truth Ledger, evidence, lineage, and replay references
- impact state and deterministic hash

## Impact Categories

Supported categories:

- `DIRECT_IMPACT`
- `SECONDARY_IMPACT`
- `CASCADING_IMPACT`
- `LONGITUDINAL_IMPACT`
- `CROSS_SYSTEM_IMPACT`

Supported modes:

- `HISTORICAL`
- `PROJECTED`
- `COUNTERFACTUAL`
- `MIXED`

## Metrics

The engine computes deterministic metrics for:

- influence depth
- dependency counts
- governance reach
- enforcement frequency
- violation frequency
- recommendation influence
- authority interactions

Each metric set has a deterministic metric hash.

## Confidence

Confidence is deterministic, not subjective. It is derived from evidence completeness, verified correlations, dependency graph certainty, lineage completeness, replay success, cross-ledger consistency, and surfaced conflict status.

Confidence levels:

- `HIGH`
- `MEDIUM`
- `LOW`
- `INSUFFICIENT`

Insufficient confidence fails validation.

## API Surface

Phase 7B.4 exposes:

- `GET /api/policy-impact-analysis/contract`
- `POST /api/policy-impact-analysis/analyze`
- `POST /api/policy-impact-analysis/validate`
- `POST /api/policy-impact-analysis/hash`
- `POST /api/policy-impact-analysis/transition`
- `POST /api/policy-impact-analysis/replay`
- `POST /api/policy-impact-analysis/explain`
- `GET|POST /api/policy-impact-analysis/inspect`

All routes require an authenticated workspace member.

## Certification Posture

The engine accepts only valid 7B.1 analyses, verified 7B.2 correlations, and valid replayable 7B.3 graph snapshots.

It fails closed for missing scope, missing affected objects, unsupported impact categories or modes, unsupported impact paths, missing timelines, missing evidence, missing lineage, missing replay refs, replay mismatch, tenant mismatch, unbounded projections, projected impacts treated as historical fact, authority expansion, enforcement attempts, and impact hash mismatch.

The output is ready for 7B.5 Policy Intelligence Certification Gate.
