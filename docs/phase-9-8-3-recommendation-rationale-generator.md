# Mission Control Phase 9.8.3 - Recommendation & Rationale Generator

## Preview

Phase 9.8.3 turns a validated operator decision package into deterministic, operator-readable explanation artifacts. It explains the existing recommendation, rationale, mission alignment, objective justification, expected benefit, assumptions, and projected outcome without changing recommendations or introducing new reasoning.

## Tightened Contract

- The generator explains only validated package content; it does not decide, reprioritize, approve, execute, or reinterpret evidence.
- Every explanation must answer what is recommended, why it was selected, how it supports the mission, what benefits are expected, what assumptions were made, and what outcome is anticipated.
- Replay and lineage references are mandatory.
- Explanations are advisory-only, tenant-bound, governance-aware, constitutionally visible, deterministic, and integrity-protected.
- Missing narrative components, tampering, invalid package builds, replay divergence, or unauthorized generation fail closed.

## Implementation

- Types: `types/recommendation-rationale-generator.ts`
- Service: `services/recommendation-rationale-generator/index.ts`
- Tests: `tests/unit/recommendation-rationale-generator/recommendationRationaleGenerator.test.ts`

## Explanation Evidence

The service publishes `getRecommendationRationaleFoundation()`, mission alignment records, assumption summaries, recommendation explanations, explanation validation, immutable explanation ledger entries, deterministic replay validation, and observability counters.
