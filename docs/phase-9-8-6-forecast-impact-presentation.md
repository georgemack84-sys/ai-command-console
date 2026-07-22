# Phase 9.8.6 - Forecast & Impact Presentation

## Preview

Phase 9.8.6 adds the operator-facing presentation layer for forecast and mission impact information inside decision packages. It renders validated upstream forecast summaries, mission impact, dependency effects, future state projections, expected outcomes, uncertainty, replay references, lineage references, and immutable ledger records.

## Tightened Contract

This phase is presentation-only. It does not generate forecasts, recalculate probabilities, rescore risk, reprioritize impacts, or reinterpret simulation output. Its deterministic output is derived from the validated Phase 9.8.5 evidence, risk, and confidence summary plus the assembled operator decision package.

The engine fails closed when forecast summary, mission impact, dependency analysis, future state projection, projected outcomes, forecast confidence, replay, lineage, integrity, tenant isolation, advisory-only behavior, or upstream evidence validity cannot be verified.

## Implementation

- `types/forecast-impact-presentation.ts` defines the presentation, mission impact, dependency impact, future state projection, visualization model, validation, ledger, replay, observability, and foundation contracts.
- `services/forecast-impact-presentation/index.ts` implements deterministic rendering, validation, integrity hashing, immutable ledger creation, replay verification, observability, and the foundation export.
- `tests/unit/forecast-impact-presentation/forecastImpactPresentation.test.ts` covers deterministic presentation, no upstream forecast mutation, impact/dependency/future-state rendering, fail-closed validation, governance/security boundaries, replay divergence, and integrity tampering.

## Certification Notes

Forecast and impact presentation is ready for Phase 9.8 certification when focused and stack tests pass, `npm run typecheck` succeeds, and ESLint reports only the existing ignored-service-file warning for this repository pattern.
