# Phase 25 — Knowledge-Gap Detection Exit Validation

Validated on 2026-09-03:

- `npx tsc --noEmit --pretty false`
- `npx vitest run --config vitest.config.mjs --environment node --pool forks --maxWorkers 1 --no-file-parallelism tests/unit/learning-constitution/phase25Acceptance.test.ts`

The acceptance scenario decomposes a system-design prediction into required knowledge, retains a critical unknown as `UNKNOWN` with `null` confidence, and blocks decision prediction rather than converting missing evidence into inference.

It selects that material gap for one Socratic question, records an append-only gap and resolution plan, and retains the audit event. Knowledge-gap detection creates no durable knowledge, authority, directive, or execution permission.
