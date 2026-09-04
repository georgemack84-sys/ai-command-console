# Phase 12 validation

Validated locally on 2026-09-01:

- `npx prisma migrate deploy` applied `202609010002_phase12_correction_learning`.
- `npx prisma migrate status` reported the database schema up to date (39 migrations).
- `npx vitest run tests/unit/learning-constitution/correctionLearning.test.ts` passed 10 tests.
- `npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed for Phase 12 changes.

The focused tests cover explicit/implicit detection, idempotent intake, conservative target resolution, scope/error classification, dependency impact labeling, bounded candidate extraction, gated supersession, counterfactual regression evidence, root-cause analysis, and non-mutating recurring-error candidates.
