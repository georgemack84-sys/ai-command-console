# Phase 8M.35 Governance Intelligence / Risk Bundle

## Scope

Phase 8M.35 resolves only the Governance Intelligence / Risk residual generated bundle. The bundle contains decision influence and violation pattern API routes, service implementations, type contracts, targeted unit coverage, and paired phase documentation.

EdgeBook, `src/tests/`, predictive intelligence, and unrelated service roots remain excluded.

## Included Files

- `app/api/decision-influence-analysis/`
- `app/api/violation-patterns/`
- `services/decision-influence-analysis/`
- `services/violation-patterns/`
- `tests/unit/decision-influence-analysis/`
- `tests/unit/violation-patterns/`
- `types/decision-influence-analysis.ts`
- `types/violation-patterns.ts`
- `docs/phase-7g-3-decision-influence-analysis.md`
- `docs/phase-7c-2-violation-pattern-detection.md`
- `docs/phase-8m-governance-intelligence-risk-bundle.md`

## Excluded Files

- EdgeBook files
- `src/tests/`
- Predictive intelligence files already committed
- Recommendation constraint files already committed
- Runtime simulation files already committed
- Unrelated generated artifacts
- Unrelated source-classified service roots
- Experimental files
- Archive candidates

## Dependency Check

The decision influence service imports existing confidence helpers, governance lineage, and policy lineage reconstruction services. The violation pattern service imports existing confidence helpers and `buildGovernanceRiskRecord` from the committed governance risk service. API routes import their local `core` helpers and existing API response/auth utilities.

Inspection found no references from the staged bundle to EdgeBook, `src/tests/`, predictive intelligence, recommendation constraint, or runtime simulation paths. The bundle keeps broader EdgeBook and remaining manual-review source roots outside the commit.

## Risk

Risk level: High, bounded.

The bundle adds API routes, service behavior, type contracts, and tests across two governance-related families. Risk is bounded by staging only paired decision influence and violation pattern artifacts, by leaving EdgeBook separate, and by validating the dedicated unit suites before commit.

## Validation Plan

- Stage guard with `git diff --cached --name-only`
- Stage statistics with `git diff --cached --stat`
- Targeted Vitest: `npx vitest run --config vitest.config.mjs tests/unit/decision-influence-analysis tests/unit/violation-patterns --reporter dot`
- TypeScript: `npm run typecheck`
- Lint: `npm run lint`
- Classifier: `node scripts/phase-8m-quality-gate.cjs --classify`

## Commit Readiness

Ready to stage if the cached diff contains only governance intelligence/risk files and required Phase 8M evidence reports. Commit readiness requires the stage guard, targeted governance intelligence/risk validation, TypeScript, lint, and classifier to pass.

Certification remains FAIL after this phase because residual generated artifacts, remaining source changes, the deferred test repair, full unit suite validation, production build validation, and release validation remain unresolved.
