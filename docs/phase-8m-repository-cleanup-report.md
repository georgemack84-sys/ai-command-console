# Phase 8M Repository Cleanup Report

Status: active cleanup planning

Certification impact: blocks PASS until reconciled

## Summary

The repository currently contains a large dirty worktree dominated by untracked phase-generated families across APIs, services, tests, types, UI shells, and documentation. These entries may be valuable, but they cannot remain ambiguous if Mission Control is to become release-certifiable.

Observed Phase 8M gate snapshot:

- Modified tracked files: 8
- Untracked entries: 883
- Total dirty entries: 903
- Service families: 379
- Service families with matching unit-test directories: 294
- Service families without matching unit-test directories: 85
- Phase documentation files: 188
- Generated candidates: 2466

## Cleanup Buckets

### Keep

Criteria:

- Required by current product shell or Mission Control runtime.
- Has passing tests or a clear test owner.
- Has route, service, type, and documentation alignment.
- Has a named module owner.

Current likely keep candidates:

- `src/server/**`
- `app/api/v1/**`
- `services/mission-control/**`
- `services/recommendation-*`
- `services/*replay*`
- `services/*integrity*`
- `services/*certification*`
- `tests/unit/recommendation-*`
- `tests/unit/mission-control/**`
- `docs/phase-8m-*`

### Generated But Useful

Criteria:

- Follows phase naming convention.
- Includes route/service/type/test/doc pairs.
- Needs generated-code metadata before commit.
- Should be committed in coherent phase bundles, not all at once.

Current generated families:

- `app/api/*-certification-*`
- `app/api/*-contract`
- `app/api/*-engine`
- `services/*-certification-*`
- `services/*-contract`
- `services/*-engine`
- `types/*`
- `tests/unit/<matching-family>`
- `docs/phase-*`

Required action:

- Add generated ownership metadata before certification.
- Group by phase and domain before commit.
- Verify each generated family has tests or a documented exemption.

### Experimental

Criteria:

- Has no direct runtime route or test owner.
- Appears to be exploratory Phase 8+ expansion.
- May be architecturally valuable but is not release-critical.

Current experimental candidates:

- Autonomy expansion families.
- Prediction and preventative recommendation families.
- Alternative runtime assurance families.
- Mission-control visualization/workspace expansions.
- QCI foundation documents and related source-registration slices.

Required action:

- Move to an explicit experimental registry or keep untracked until accepted.
- Do not let experimental families block production shell verification unless promoted.

### Archive Candidates

Criteria:

- Historical reports, temporary logs, old project snapshots, or superseded docs.
- Not imported by app, service, test, or deployment path.

Current archive candidates:

- Root-level historical reports.
- Temporary `.codex-temp-*` logs.
- Previous generated project reports.
- Old phase docs superseded by architecture indexes.

Required action:

- Archive before deletion.
- Preserve manifest with original path and rationale.

### Remove Candidates

Criteria:

- Build artifacts, runtime residue, duplicate generated files, stale temp files, or obsolete unreferenced prototypes.
- No owner and no import path.

Current remove candidates:

- Runtime residue that should live under `.codex-temp/runtime-data`.
- Untracked duplicate generated families after canonical owner selection.
- Temporary test/build outputs outside ignored directories.

Required action:

- Do not delete until classification is reviewed.
- Prefer `npm run dev:state-report` and `npm run dev:state-cleanup` for known legacy state residue.

## Modified Tracked Files

Existing modified files before Phase 8M scaffold:

- `app/api/v1/runtime/health/route.ts`
- `app/globals.css`
- `app/layout.tsx`
- `next.config.ts`
- `package.json`
- `services/recommendation-constraint/index.ts`
- `services/simulation-engine/index.ts`
- `services/simulation-engine/types.ts`

Phase 8M additions and edits:

- `docs/phase-8m-mission-control-consolidation-reliability-gate.md`
- `docs/phase-8m-repository-cleanup-report.md`
- `scripts/phase-8m-quality-gate.cjs`
- `package.json`
- `tests/unit/recommendation-resilience/resilienceAnalysisEngine.test.ts`

## Reconciliation Plan

1. Freeze new generated phase expansion.
2. Run `npm run phase:8m:gate -- --changed`.
3. Export dirty entries into a reviewed inventory.
4. Assign each entry a bucket: keep, generated-useful, experimental, archive, remove.
5. Commit Phase 8M scaffolding and test fixes separately from pre-existing generated phase expansion.
6. Commit or archive generated families by coherent phase/domain bundles.
7. Run `npm run verify:fast`.
8. Fix lint warnings or explicitly downgrade generated warnings by policy.
9. Run affected service-family tests.
10. Run `npm run verify:release` once dirty state is reconciled.

## Current Certification Finding

State: FAIL

Blockers:

- Dirty worktree unresolved.
- Generated code ownership not fully assigned.
- Full unit suite not proven green.
- Production build not proven green.
- Release pipeline not proven reproducible.

Progress:

- Phase 8M gate script exists.
- Verification tier scripts exist.
- Lint exits successfully with warnings.
- TypeScript passes.
- `recommendation-resilience` analysis test blocker is fixed.
- Focused recommendation resilience/trust test set passes: 3 files, 23 tests.
- Dirty worktree classification is now emitted by `npm run phase:8m:gate -- --classify`.
