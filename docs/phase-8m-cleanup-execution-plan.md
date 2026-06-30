# Phase 8M Cleanup Execution Plan

Status: active execution plan

## Goal

Move Mission Control from partial stabilization toward Phase 8M Reliability Certification PASS without adding features or weakening governance, replay, constitutional, or certification guarantees.

## Execution Roadmap

### 1. Isolate Stabilization Bundle

Scope:

- Phase 8M reports.
- Phase 8M gate script.
- Verification script entries.
- Recommendation resilience fixture repair.
- Truth Ledger completion lint cleanup.

Exit criteria:

- Bundle is reviewed independently.
- Generated phase expansion remains excluded.
- Targeted validations remain green.

### 2. Reconcile Dirty Worktree

Scope:

- Run `npm run phase:8m:gate -- --classify`.
- Export classification.
- Assign every entry to a disposition: commit, defer, archive, remove, or split.

Exit criteria:

- No ambiguous dirty entries.
- Each generated family has owner and phase/domain.

### 3. Govern Generated Modules

Scope:

- Generated APIs.
- Generated services.
- Generated types.
- Generated tests.
- Generated docs.

Exit criteria:

- Generated-code policy applied.
- Each generated family has test evidence or exemption.
- Generated expansion is committed only in coherent bundles.

### 4. Complete Architecture Index

Scope:

- Service families.
- API families.
- UI families.
- Replay, governance, runtime, certification, recommendation, autonomy, and mission-control domains.

Exit criteria:

- Module ownership map exists.
- Lifecycle map exists.
- Dependency graph plan exists.

### 5. Modernize Verification

Scope:

- `verify:fast`
- `verify:changed`
- `verify:domain`
- `verify:phase`
- `verify:release`
- `verify:full`

Exit criteria:

- Each tier is proven executable.
- Failure criteria are documented.
- Slow gates are measured.

### 6. Reprove Build And Tests

Order:

1. Targeted affected tests.
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test:unit`
5. `npm run test:legacy`
6. `npm run build`
7. `npm run check:legacy-state -- --strict`
8. `npm run verify:release`
9. `npm run verify:full`

Exit criteria:

- Full unit suite passes.
- Production build passes.
- Release gate passes.

### 7. Certify Production Readiness

PASS requirements:

- Repository clean or intentionally reconciled.
- TypeScript, lint, tests, build, replay, governance, certification, and deployment gates pass.
- Generated modules governed.
- Architecture and module ownership documented.
- CI and release pipeline operational.
- Tenant isolation, operator visibility, constitution, authority, governance, and replay guarantees preserved.

## Production Readiness Summary

Current state: not production-ready.

Reason:

- Dirty worktree unresolved.
- Full test/build release path not proven.
- Generated expansion not governed.

Direction:

- The stabilization bundle improves reviewability and provides the first auditable classification and validation baseline.

See also:

- `docs/phase-8m-repository-reconciliation-plan.md`
- `docs/phase-8m-certification-assessment.md`
- `docs/phase-8m-generated-phase-expansion-report.md`
