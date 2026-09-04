# Phase 20 — Practice Engine Exit Validation

Validated on 2026-09-02:

- `npx tsc --noEmit --pretty false`
- `npx vitest run --config vitest.config.mjs --environment node --pool forks --maxWorkers 1 --no-file-parallelism tests/unit/learning-constitution/phase20Acceptance.test.ts`

The integrated acceptance scenario verifies that practice retrieves authoritative, snapshot-bound lineage across prerequisite skills; creates the full Exact-to-Adversarial transfer ladder with independent difficulty and transfer distance; separates hidden evaluator material from learner-visible exercises; and rejects overly similar exercise generation.

It verifies the constitutional boundary as well: an Exact success produces weak, evidence-only Skill Registry input, never a durable-knowledge write, mastery declaration, authority change, or execution permission.

The scenario also verifies append-only audit history, a failed dependency exercise linked to focused remediation, refusal to authorize retest before remediation completion, lineage-preserving retest authorization afterward, and regression scheduling for an established skill without invalidating it.
