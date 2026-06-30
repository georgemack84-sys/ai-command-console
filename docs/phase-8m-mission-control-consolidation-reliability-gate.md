# Phase 8M - Mission Control Consolidation and Reliability Gate

Status: active stabilization gate

Certification result: FAIL

Reason: Phase 8M cannot honestly certify PASS while the repository has an unresolved dirty worktree, a lint failure, a failing unit test, and an unverified production build.

## Objective

Phase 8M converts Mission Control from a rapidly expanding development repository into a deterministic, reproducible, maintainable, explainable, documented, operationally reliable, governance-compliant, certification-ready platform.

This phase introduces no new autonomy capability. It is a consolidation and reliability gate only.

## Current Evidence

Observed on the current branch:

- Branch: `codex/phase-3.7-observability-diagnostics`
- TypeScript: `npm run typecheck` passed; the latest isolated run took about 153 seconds.
- Lint: `npm run lint` now exits successfully with 22 warnings after fixing the Truth Ledger completion JSX escaping issue. The latest isolated run took about 139 seconds.
- Unit tests: `npm run test:unit` timed out after three minutes; targeted `recommendation-resilience` test run failed because the default analysis state returned `INVALID` instead of `ANALYZED`.
- Build: `npm run build` timed out after three minutes during Next.js optimized production build.
- Dirty worktree: 903 entries were reported by the Phase 8M gate after adding the Phase 8M.12 bundle manifests.

## 8M.1 Repository Assessment and Inventory

### Repository Inventory

Primary directories:

- `app/`: Next.js App Router pages and API route handlers.
- `components/`: page and feature UI shells.
- `src/`: product-facing frontend, server services, shared library code, and EdgeBook modules.
- `services/`: broad Mission Control service families, including governance, replay, recommendation, autonomy, runtime, certification, integrity, and mission-control engines.
- `types/`: cross-service phase and contract types.
- `tests/`: Vitest, node:test, Playwright, unit, integration, and legacy test surfaces.
- `prisma/`: Prisma schema, migrations, and seed data.
- `scripts/`: development, deployment, verification, state cleanup, backup, and worker utilities.
- `docs/`: architecture, phase, audit, prompt, ADR, and build documentation.
- `tool-registry/`: tool definitions, schemas, policies, migrations, adapters, and lineage records.
- `data/`, `memory/`, `logs/`, `backups/`: runtime, fixture, and operational state areas that must remain governed to prevent repository churn.

### Module Catalog

Active product modules:

- Workspace, auth, session, source, alert, insight, research, dashboard, control-center, terminal, operations, policy governance, background jobs, ingestion, observability, and health services under `src/server`.

Mission Control platform modules:

- Governance, replay, integrity, lineage, query, certification, recommendation, autonomy, runtime assurance, recovery, delegation, planning, boundary enforcement, mission graph, mission control, hidden execution detection, human supremacy enforcement, and intent governance under `services`.

UI modules:

- Control center, dashboard, truth dashboard, replay viewer, ledger explorer, integrity viewer, governance dashboard, governance replay viewer, governance lineage explorer, governance integrity viewer, truth ledger certification, truth ledger completion, and visibility certification.

Database models:

- Core Prisma models include users, workspaces, sessions, sources, updates, insights, alerts, briefs, reports, invites, feature flags, agent tasks, operations state, incident approvals, and policy rollout state.

Contract and schema surfaces:

- Prisma schema.
- Zod/request schemas under `schemas`.
- Tool registry JSON schemas.
- Phase-specific TypeScript contract records under `types`.
- API route response contracts throughout `app/api`.

Ledgers and replay engines:

- Mission-control ledgers, immutable recommendation ledger, lifecycle ledgers, lineage ledger, replay contracts, replay viewers, replay certification gates, deterministic replay validation, and hash-chain/integrity services.

Generated and experimental code:

- The large families under `app/api`, `services`, `types`, `tests/unit`, and `docs/phase-*` that follow repetitive phase naming patterns should be treated as generated or semi-generated until ownership is assigned.

Deprecated or archive candidates:

- Legacy console JS modules, root-level early prototype files, old report files, temporary logs, previous project reports, and unused generated phase slices should be reviewed before deletion.

## 8M.2 Repository Cleanup and Organization

### Cleanup Plan

1. Freeze new feature and phase expansion.
2. Capture the current dirty state with `git status --short` and classify every entry as keep, generated, experimental, archive, or remove.
3. Fix gate-blocking failures before any large organization move.
4. Create an archive policy for historical reports, temporary logs, generated outputs, and superseded phase files.
5. Define ownership for generated service families before removing or moving them.
6. Normalize naming after ownership is clear.

### Generated Code Policy

Generated or semi-generated code must include:

- source generator or prompt reference;
- owning phase;
- expected test family;
- contract boundary;
- regeneration command or manual ownership note;
- archive/deprecation criteria.

Generated code must not silently expand production API surface without tests, route ownership, and documentation.

## 8M.3 Architecture Index

Mission Control architecture families:

- Product shell: Next.js app, auth, workspace, dashboard, research, operations, terminal, alerts, and settings.
- Runtime and observability: health, readiness, diagnostics, telemetry, startup governance, warnings, metrics, and alerts.
- Governance: policy enforcement, authority validation, constitutional constraints, tenant isolation, lineage, compliance, escalation, and risk.
- Replay and integrity: replay contracts, historical reconstruction, hash chains, tamper detection, integrity verification, deterministic validation, and replay viewers.
- Recommendation intelligence: generation, validation, impact, dependency, portfolio, drift, trust, resilience, constraints, ledgers, and certification.
- Autonomy and orchestration: objective decomposition, planning, execution, delegation, checkpointing, rollback preparation, boundary enforcement, runtime supervision, and final certification gates.
- Mission control: truth ledger, event/decision/evidence/recommendation/policy records, mission graph, replay investigation, visibility, and completion gates.

### Module Ownership Map

Proposed owners:

- App shell and product UX: frontend/product platform owner.
- `src/server`: product backend owner.
- `services/mission-control`: Mission Control architecture owner.
- `services/recommendation-*`: recommendation governance owner.
- `services/*replay*`, `services/*integrity*`, `services/*hash*`: replay/integrity owner.
- `services/*autonomy*`, `services/*execution*`, `services/*delegation*`: autonomy boundary owner.
- `tests/unit/<service-family>`: same owner as service family.
- `docs/phase-*`: phase owner plus architecture reviewer.

## 8M.4 Verification Pipeline Modernization

The following script entry points now exist in `package.json`:

- `verify:fast`: typecheck, lint, and Phase 8M gate inventory.
- `verify:changed`: Phase 8M changed-file inventory.
- `verify:domain`: service-family coverage inventory.
- `verify:phase`: phase documentation inventory.
- `verify:release`: lint, typecheck, unit tests, legacy tests, build, strict legacy-state guard, and Phase 8M gate inventory.
- `verify:full`: release verification plus Playwright.

Expected runtimes:

- `verify:fast`: under 2 minutes after lint is healthy.
- `verify:changed`: under 30 seconds.
- `verify:domain`: under 60 seconds.
- `verify:phase`: under 30 seconds.
- `verify:release`: 10-30 minutes depending on test/build performance.
- `verify:full`: release runtime plus browser test runtime.

Failure criteria:

- Any command exit code failure blocks the tier.
- Dirty worktree blocks certification PASS.
- Build timeout or test timeout blocks release readiness.
- Any governance, replay, authority, constitution, or tenant-isolation regression blocks release.

## 8M.5 Repository Quality Gates

Quality gates:

- TypeScript strict compilation.
- ESLint across app and owned source surfaces.
- Formatting policy.
- Dead-code and unused-import checks.
- Circular dependency checks.
- Duplicate-code checks.
- Contract and schema validation.
- Replay determinism validation.
- Governance determinism validation.
- Constitution and authority enforcement validation.
- Tenant isolation validation.
- Production build validation.
- Legacy state guard.
- Deployment configuration validation.

Implemented scaffold:

- `scripts/phase-8m-quality-gate.cjs` provides a read-only inventory, dirty-worktree classifier, verification script coverage check, domain coverage sample, phase documentation sample, and certification pre-classification.
- `npm run phase:8m:gate -- --domain` currently reports 379 service families, 294 service families with matching unit-test directories, and 85 without.
- `npm run phase:8m:gate -- --phase` currently reports 200 phase documentation files and confirms the Phase 8M report set is present.
- `npm run phase:8m:gate -- --classify` currently classifies 903 dirty entries by category and risk.

## 8M.6 Test Modernization

Testing strategy:

- Unit tests remain service-local under `tests/unit/<service-family>`.
- Integration tests remain separate from deterministic unit contracts.
- Contract tests validate API, schemas, and outbound response shapes.
- Governance tests validate authority, constitution, tenant isolation, and hidden-execution prevention.
- Replay tests validate deterministic reconstruction and output verification.
- Certification tests validate gate semantics and failure classification.
- Performance tests measure build, import, test, and service-family hotspots.

Immediate test debt:

- `recommendation-resilience` default analysis happy path currently fails.
- Full unit test runtime is too high for fast feedback when coverage is enabled.
- Some service families likely lack direct unit coverage or ownership mapping.

## 8M.7 Build and Deployment Reliability

Build reliability state:

- Production build was not verified because `npm run build` timed out after three minutes.
- Next build is configured for standalone output.
- Deployment validation scripts exist.
- Environment and preflight checks exist.

Deployment checklist:

- Validate `.env.example` remains current.
- Run `npm run preflight`.
- Run `npm run validate:deploy-config`.
- Run `npm run verify:backup` when SQLite state is in scope.
- Run `npm run verify:release` before release candidates.

## 8M.8 Performance and Scalability Assessment

Current risks:

- Repository scan breadth is high.
- Full unit suite with coverage is slow.
- Production build did not complete within the observed timeout.
- Deep imports in large generated service families increase test startup cost.
- Unbounded scans over `services`, `tests`, and generated phase files are increasingly expensive.

Optimization recommendations:

- Split coverage collection from default unit runs.
- Add service-family test shards.
- Add changed-file test selection.
- Add build profiling once lint and tests are stable.
- Keep generated files out of runtime watcher paths where possible.
- Track top slow test files and import-heavy service families.

## 8M.9 Documentation and Developer Experience

Documentation needed:

- Architecture handbook.
- Repository handbook.
- Cleanup report.
- Module ownership guide.
- Service-family guide.
- Verification guide.
- Testing guide.
- Deployment guide.
- Generated-code policy.
- Contribution guide.

Highest priority documentation updates:

- Align README with the current Mission Control platform scope.
- Create an architecture index linking service families to phases and tests.
- Document verification tiers and certification states.
- Document cleanup and archive policy before deleting any phase files.
- Use `docs/phase-8m-repository-cleanup-report.md` as the working cleanup plan.

## 8M.10 Reliability Certification Gate

### Certification State

FAIL

### Blocking Conditions

- Dirty worktree unresolved.
- Lint passes with warnings that still need cleanup before PASS.
- The targeted `recommendation-resilience` analysis test failure is fixed, but the full unit suite has not been reproven green.
- Full unit suite did not complete under observed timeout during the initial assessment.
- Production build was not verified.
- Generated code ownership is not fully documented.
- Architecture index is newly introduced but not yet complete enough for PASS.
- Verification tiers are scaffolded but not yet proven green.

### PASS Requirements

PASS requires:

- Clean or intentionally reconciled worktree.
- Complete inventory.
- Complete architecture index.
- Module ownership defined.
- Generated code governed.
- Documentation current.
- TypeScript, lint, formatting, unit, integration, replay, governance, certification, build, and deployment gates green.
- Dependency graph validated.
- Circular dependency and dead-code checks operational.
- Contracts and schemas validated.
- Replay deterministic.
- Governance deterministic.
- Constitution and authority enforcement verified.
- Tenant isolation verified.
- CI and release pipeline operational.
- Production deployment reproducible.

### Conditional Pass Path

CONDITIONAL_PASS is possible after:

- TypeScript remains green.
- Lint is green.
- Production build succeeds.
- Critical tests pass.
- Dirty worktree is reduced to reviewed, intentional entries.
- Governance, constitution, replay, authority, and tenant isolation gates are demonstrably deterministic.

Production release remains blocked until PASS.

## Required Data Objects

Repository Inventory:

- directory inventory, service counts, API families, UI families, docs, tests, schemas, contracts, ledgers, replay engines, runtime engines, generated candidates, and archive candidates.

Module Record:

- name, path, family, owner, phase, status, tests, contracts, dependencies, generated status, deprecation status.

Service Record:

- service family, public exports, route consumers, type contracts, test coverage, certification requirements.

Verification Pipeline:

- name, scope, order, gates, runtime expectation, failure criteria, parallelization model.

Quality Gate:

- gate name, command, owner, scope, blocking severity, evidence artifact.

Build Report:

- command, duration, status, artifact path, warnings, failures, reproducibility notes.

Test Suite:

- name, command, scope, expected duration, coverage mode, failure policy.

Architecture Map:

- phase, domain, service family, API family, UI family, contracts, tests, owner.

Dependency Graph:

- module nodes, import edges, route-to-service edges, service-to-contract edges, cycle status.

Module Ownership:

- family, owner, reviewer, escalation path, deprecation authority.

Cleanup Record:

- path, status, action, rationale, owner, risk, verification.

Certification Result:

- state, blockers, evidence, expiration, approval.

Reliability Report:

- gate results, risk classification, readiness state, next actions.

## Immediate Execution Plan

1. Fix the lint JSX escaping error.
2. Investigate `recommendation-resilience` invalid default state.
3. Rerun targeted tests and lint.
4. Run `npm run phase:8m:gate`.
5. Reconcile dirty worktree into keep/generated/archive/remove buckets.
6. Update README and architecture docs after ownership is assigned.
7. Prove `verify:fast`, then `verify:release`, then `verify:full`.

Completed from this plan:

- Fixed the Truth Ledger completion JSX lint error.
- Fixed the `recommendation-resilience` default analysis fixture by using replayable trust artifacts for the happy path.
- Verified `recommendation-resilience` analysis tests pass: 7 tests.
- Verified adjacent trust replay and certification tests still pass: 16 tests.
- Verified the combined focused set passes: 3 files, 23 tests.
