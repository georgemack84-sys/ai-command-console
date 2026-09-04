# Phase 18 — Skill Registry Exit Validation

Validated on 2026-09-01:

- `npx tsc --noEmit --pretty false`
- `npx vitest run tests/unit/learning-constitution/skillRegistry.test.ts tests/unit/learning-constitution/skillRegistry.acceptance.test.ts --pool=forks --reporter=verbose`

The acceptance suite verifies procedure-versus-skill separation, rejection of unsupported capability claims, evaluation-history assessment, duplicate-evidence resistance, human-gated provisional promotion, immutable evidence revocation, reassessment audit emission, and the absence of execution permission.
