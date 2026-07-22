# Phase 9.8.11 - Decision Package Observability & Explainability

## Preview

Phase 9.8.11 adds the observability and explainability layer for completed operator-facing decision packages. It measures package completeness, explanation quality, evidence coverage, governance visibility, replay readiness, generation analytics, operator usability, dashboard views, validation, and immutable observability ledger entries.

## Tightened Contract

This phase measures and reports only. It does not modify decision packages, change recommendations, alter evidence, alter governance outcomes, modify authority requirements, mutate ledger records, or execute workflows.

The observability layer fails closed when completeness metrics, explainability metrics, operator visibility reports, replay verification, analytics, replay references, lineage references, integrity, upstream ledger validity, tenant isolation, or advisory-only behavior cannot be verified.

## Implementation

- `types/decision-package-observability.ts` defines observability records, completeness metrics, explainability metrics, generation analytics, operator visibility reports, dashboards, scorecards, validation, ledger, replay, and foundation contracts.
- `services/decision-package-observability/index.ts` implements deterministic metrics collection, scorecards, dashboard views, validation, integrity hashing, immutable observability ledger creation, replay verification, observability metrics, and the foundation export.
- `tests/unit/decision-package-observability/decisionPackageObservability.test.ts` covers deterministic metrics, dashboard generation, fail-closed validation, upstream ledger failures, tenant/advisory/security boundaries, replay divergence, and integrity tampering.

## Certification Notes

This phase is ready for Phase 9.8 certification when focused tests, 9.7/9.8 stack tests, broad decision sweeps, typecheck, and lint pass with only the repository's expected ignored-service-file warning.
