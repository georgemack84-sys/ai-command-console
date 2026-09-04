# Phase 31 — Autonomous Practice Exit Validation

Validated on 2026-09-03:

- `npx prisma migrate status`
- `npx tsc --noEmit --pretty false`
- `npx vitest run tests/unit/learning-constitution/autonomousPractice.test.ts tests/unit/learning-constitution/phase31Acceptance.test.ts tests/unit/learning-constitution/practiceExercise.test.ts tests/unit/learning-constitution/learningAuditLedger.test.ts`

The acceptance scenario proves autonomous practice requires a valid, active practice lease; freezes distinct learner and evaluator contexts; keeps the answer key sealed until after attempt commitment; produces only evidence-level output; routes failure toward Reflection; suspends a conflicted exercise without rewriting its key; and records the significant evidence transition in Phase 10's immutable audit ledger.
