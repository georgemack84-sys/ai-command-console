# Mission Control Phase 10.3.3 - Recommendation Quality Scoring

## Preview

Phase 10.3.3 adds the deterministic scoring framework for evaluating recommendation quality after operator review, observed outcomes, effectiveness evaluation, and expected-vs-actual variance comparison.

## Tightened Contract

Quality scoring converts already-certified evidence into objective, replayable quality metrics. It does not learn, adapt recommendation behavior, modify recommendations, rewrite outcomes, alter operator actions, or replace governance judgment. Every score is tenant-scoped, evidence-backed, explainable, governance-controlled, immutable, append-only, and cryptographically verifiable.

## Scoring Model

Every certified quality score covers usefulness, completeness, correctness, explainability, evidence quality, confidence quality, governance compliance, authority correctness, alternative usefulness, rollback usefulness, and operator usability. The composite score is calculated from a versioned governance-approved weighting profile. Weight values are deterministic, documented, normalized, and immutable for the profile version.

## Fail-Closed Validation

Certification blocks missing dimensions, incomplete evidence, invalid weighting profiles, missing governance, missing replay, incomplete lineage, integrity mismatch, tenant isolation violation, recommendation reconstruction failure, unverifiable evidence, non-reproducible composite scores, governance failure, constitutional failure, replay divergence, ledger mutation, missing explanations, and fail-open behavior.

## Implementation

Implemented artifacts:

- `types/recommendation-quality-scoring.ts`
- `services/recommendation-quality-scoring/index.ts`
- `app/api/recommendation-quality-scoring/*`
- `tests/unit/recommendation-quality-scoring/recommendationQualityScoring.test.ts`

The service composes the Phase 10.3.2 Expected vs Actual Comparator, applies the approved deterministic weighting profile, calculates raw and weighted dimension scores, derives a composite effectiveness score and quality rating, validates governance/replay/ledger/integrity constraints, and exposes hash/replay/foundation helpers for Phase 10.3.4.
