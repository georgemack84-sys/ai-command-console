# Noesis Phase 15 — Example Library Exit

## Exit criteria

- [x] Canonical example, parent, coverage, review, selection, and lifecycle types are defined.
- [x] Durable workspace-scoped append-only artifacts are migrated in `202609010005_phase15_example_library`.
- [x] Candidate validation rejects missing parent/provenance and defers scope expansion, rules, and exceptions.
- [x] Human-only approval/rejection and invalidation/supersession are audit-recorded.
- [x] Teaching and evaluation select approved, compatible, diverse examples only.
- [x] Manager coverage, submission, review, and lifecycle controls are protected by workspace-manager permission.
- [x] End-to-end acceptance test asserts evidence-only authority and execution boundaries.

## Validation command

`npx vitest run tests/unit/learning-constitution/exampleLibrary.test.ts tests/unit/learning-constitution/exampleLibrary.acceptance.test.ts --pool=forks`

Expected: 2 files and 9 tests pass. TypeScript compilation and Prisma migration status must also succeed.
