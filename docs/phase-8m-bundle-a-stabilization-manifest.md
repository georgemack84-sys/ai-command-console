# Phase 8M.12A Bundle A Stabilization Manifest

Status: commit-ready candidate, not staged

Certification impact: repository remains FAIL until Bundle A is committed or otherwise isolated and the remaining worktree is reconciled.

## Bundle Purpose

Bundle A isolates the minimum stabilization work needed to make Phase 8M reviewable:

- expose a read-only Phase 8M quality gate and dirty-worktree classifier
- preserve repeatable validation commands in `package.json`
- document the repository repair boundary
- keep the targeted resilience test repair with its evidence
- keep the Truth Ledger lint cleanup required for the scoped lint pass

Bundle A does not add Mission Control features, generated modules, runtime architecture, or production behavior.

## Included Files

| File | Justification |
| --- | --- |
| `package.json` | Adds Phase 8M verification scripts and preserves existing project scripts required for repeatable validation. |
| `scripts/phase-8m-quality-gate.cjs` | Adds the read-only inventory, changed-file, domain, phase, and dirty-worktree classifier used to govern this repair. |
| `docs/phase-8m-*` | Contains only Phase 8M stabilization, cleanup, validation, classification, bundle, and certification evidence. |
| `tests/unit/recommendation-resilience/resilienceAnalysisEngine.test.ts` | Keeps the targeted fixture repair that restores deterministic resilience validation without changing production logic. |
| `components/truth-ledger-completion/TruthLedgerCompletionGateShell.tsx` | Keeps lint-only cleanup for the scoped Truth Ledger completion shell. |

## Expected Bundle A Path Set

The commit-ready candidate is limited to these pathspecs:

```text
package.json
scripts/phase-8m-quality-gate.cjs
docs/phase-8m-*.md
tests/unit/recommendation-resilience/resilienceAnalysisEngine.test.ts
components/truth-ledger-completion/TruthLedgerCompletionGateShell.tsx
```

## Excluded Files

Bundle A explicitly excludes:

- generated phase expansion files
- unrelated source changes
- non-Phase-8M documentation
- experimental files
- archive candidates
- temporary or generated runtime artifacts

## Bundle Statistics

Current expected Bundle A review surface after Phase 8M.12A documentation:

- Root metadata/script files: 2
- Phase 8M documentation files: 17
- Targeted test repair files: 1
- Targeted lint cleanup files: 1
- Total expected Bundle A files: 21

Dirty-worktree counts are recorded in the validation report after the latest classifier run.

## Commit Readiness Assessment

Bundle A is commit-ready only if the staged set exactly matches the expected path set above.

Do not stage parent directories such as `components/truth-ledger-completion/` or `tests/unit/recommendation-resilience/` as broad directory adds because they may include future unrelated files. Use explicit files or the documented pathspecs only.

Recommended commit title:

```text
chore: isolate phase 8m stabilization bundle
```

## Review Checklist

- Confirm no generated phase expansion files are staged.
- Confirm no Bundle C source changes are staged.
- Confirm non-Phase-8M docs are not staged.
- Confirm `npm run typecheck` passes.
- Confirm `npm run lint` passes with only known non-blocking warnings.
- Confirm targeted resilience and trust tests pass.
- Confirm `node scripts/phase-8m-quality-gate.cjs --classify` runs and keeps certification FAIL because the broader worktree is unresolved.
