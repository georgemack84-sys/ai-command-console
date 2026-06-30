# Phase 8M Dirty Worktree Classification

Status: classified by rule-based Phase 8M gate

Authoritative command:

```bash
npm run phase:8m:gate -- --classify
```

The gate emits every dirty entry with:

- status
- path
- category
- risk
- rationale

## Classification Categories

- Phase 8M Stabilization
- Generated Phase Expansion
- Documentation
- Test Repairs
- Source Changes
- Experimental
- Archive Candidates
- Temporary

## Current Classification Snapshot

Observed after Phase 8M.12 bundle manifests were added:

| Category | Count | Risk |
| --- | ---: | --- |
| Generated Phase Expansion | 850 | High |
| Source Changes | 26 | High |
| Documentation | 9 | Medium |
| Test Repairs | 1 | Medium |
| Phase 8M Stabilization | 17 | Low |

Risk totals:

| Risk | Count |
| --- | ---: |
| High | 876 |
| Medium | 10 |
| Low | 17 |

## Phase 8M Stabilization Entries

Current stabilization bundle entries are expected to include:

- `package.json`
- `scripts/phase-8m-quality-gate.cjs`
- `docs/phase-8m-*`
- `tests/unit/recommendation-resilience/`
- `components/truth-ledger-completion/`

## Generated Phase Expansion

Generated phase expansion currently dominates the dirty worktree.

Patterns:

- `app/api/*`
- `services/*`
- `types/*`
- `tests/unit/*`
- `components/governance-*`
- `components/replay-*`
- `components/truth-*`
- `app/governance-*`
- `app/replay-*`
- `app/truth-*`
- `docs/phase-*` outside Phase 8M

Action:

- Do not include this expansion in the Phase 8M stabilization bundle.
- Classify by phase/domain.
- Assign owner.
- Require matching tests or documented exemption.

## Source Changes

Source changes outside Phase 8M require separate review.

Known modified tracked source/infrastructure files:

- `app/api/v1/runtime/health/route.ts`
- `app/globals.css`
- `app/layout.tsx`
- `next.config.ts`
- `services/recommendation-constraint/index.ts`
- `services/simulation-engine/index.ts`
- `services/simulation-engine/types.ts`

Action:

- Review separately from Phase 8M docs/gate work.
- Do not mix with generated expansion.

## Certification Impact

Dirty worktree remains the primary blocker. Phase 8M certification remains FAIL until every category is either committed as an approved bundle, archived, removed through an approved cleanup, or explicitly deferred outside the release boundary.

## Completeness Rule

Every dirty worktree entry is assigned exactly one category by `scripts/phase-8m-quality-gate.cjs`. The full inventory is emitted by:

```bash
node scripts/phase-8m-quality-gate.cjs --classify
```

That JSON output is the working dirty worktree inventory for Phase 8M.11.
