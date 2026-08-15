# Week 2 Foundation Admission

## Baseline identity

| Field | Value |
| --- | --- |
| Repository | `georgemack84-sys/ai-command-console` |
| Branch | `codex/day5-gp17-final-qualification` |
| Commit | `d6a25c87423d69877965d7cb1541b726c7ad3b5d` |
| GP-17 qualification | `DAY 5 QUALIFICATION: QUALIFIED` |
| Working tree | Clean at the GP-17 handoff |
| Evidence | [Day 5 qualification](qualification.md) |
| Supported environments | Windows 11 / PowerShell 7 and GitHub Ubuntu |

This record freezes the GP-17 revision as the historical Week 1 baseline. It does
not claim that GP-17 tested later revisions.

## Required CI contract

GP-17 pull-request CI run `31771116358` records the authoritative seven-gate
contract. The local equivalents remain:

| Required check | Local equivalent | Protected behavior | Baseline status |
| --- | --- | --- | --- |
| Repository Validation | `npm run repo -- validate repo`; command and workflow tests | repository, documentation, evidence, command, and workflow policy | PASS |
| Frontend Validation | `npm run repo -- validate frontend`; frontend build and browser suites | format, lint, types, architecture, unit/UI behavior, production build | PASS |
| Backend Validation | `npm run repo -- validate backend`; backend unit tests | format, compiler/analyzers, architecture, classification, unit behavior | PASS |
| Integration Validation | `npm run repo -- migrate`; classified integration tests | canonical migrations and real dependency behavior | PASS |
| Docker Validation | `npm run repo -- validate docker` | Compose contract and application images | PASS |
| OpenAPI Validation | `npm run repo -- validate openapi` | canonical generated API contract | PASS |
| Health Validation | `npm run repo -- dev`; `npm run repo -- health` | startup, liveness, readiness, persistence, and cleanup | PASS |

The workflow test protects the exact check names because branch protection can
depend on them.

## Protected foundation inventory

| Area | Actual authorities |
| --- | --- |
| Configuration | `.env.example`; `apps/web/.env.example`; `services/api/.env.example`; `docs/onboarding/configuration.md`; `scripts/validate-configuration.cjs` |
| Repository standards | `.editorconfig`; `.gitattributes`; `.gitignore`; `package-lock.json`; `apps/web/package-lock.json`; `global.json`; `Directory.*` |
| Frontend | `apps/web/tsconfig.json`; `apps/web/eslint.config.mjs`; `apps/web/.prettierrc.json`; `apps/web/.dependency-cruiser.cjs` |
| Backend and architecture | `Directory.Build.props`; `Directory.Build.targets`; `services/api/Proprium.sln`; architecture and classification validators/tests |
| Commands | `scripts/proprium-command.cjs`; `scripts/proprium.ps1`; `docs/engineering/repository-commands.md` |
| CI | `.github/workflows/ci.yml`; `scripts/verify-ci-workflow.cjs` |
| Migrations | `services/api/Proprium.Infrastructure/Persistence/Migrations`; `database-migrations`; `docs/operations/migrations.md` |
| OpenAPI | `scripts/validate-openapi-generation.cjs`; `scripts/validate-openapi.cjs`; API OpenAPI configuration |
| Health | API health endpoints; `docker-compose.proprium.yml`; `docs/architecture/ADR-0005-container-health.md` |
| Documentation/evidence | `README.md`; `docs/onboarding`; `docs/operations`; `docs/validation/day-5`; documentation and baseline validators |

## Week 2 dependency review

No dedicated Week 2 feature-roadmap file exists in this revision. The GP-17
handoff and current repository documentation identify the foundation dependencies
that any Week 2 plan inherits:

| Week 2 dependency | Day 5 contract | Ready | Evidence |
| --- | --- | --- | --- |
| Frontend feature work | strict frontend build, tests, and dependency boundaries | YES | Frontend Validation passed |
| API and persistence work | backend compiler/architecture policy and EF migration authority | YES | Backend and Integration Validation passed |
| Runtime dependencies | explicit configuration plus liveness/readiness semantics | YES | configuration and Health Validation passed |
| Developer execution | canonical cross-platform commands and onboarding | YES | command parity and onboarding evidence passed |
| Merge admission | seven stable, locally reproducible CI gates | YES | CI workflow contract and successful run |

Adding a Week 2 feature roadmap is planning work, not a prerequisite defect in the
qualified engineering platform. Each feature must still confirm its own product
dependencies before implementation.

## Known constraints

| Constraint | Impact | Blocking | Owner |
| --- | --- | --- | --- |
| macOS is not certified | macOS behavior is not part of the supported baseline | NO | future platform enablement |
| Clean operating-system provisioning was not executed | evidence covers a clean repository state on a prepared Windows workstation | NO | future environment qualification |
| Migration creation tooling is not repository-pinned | migration creation remains maintainer-controlled; apply/validation is canonical | NO | future foundation amendment |
| Existing npm advisories remain | dependency maintenance remains required; no Day 5 gate was bypassed | NO | dependency maintenance |
| Week 2 feature roadmap is not present | feature-specific prerequisites must be confirmed when that roadmap is added | NO | Week 2 planning |

No blocking Day 5 defect is outstanding.

## Amendment and requalification rule

Changes are classified as `NON_FOUNDATION`, `FOUNDATION_COMPATIBLE`,
`FOUNDATION_AMENDMENT`, or `FOUNDATION_BREAKING`. Amendments must identify the
affected contract, migration/compatibility impact, docs, tests, CI, ADR decision,
and requalification scope. Broad rule suppression, skipped required checks,
parallel migration or OpenAPI authorities, and CI-only validation paths are
blocking regressions.

Historical GP-17 evidence is preserved. Material foundation changes produce new
evidence rather than editing GP-17 to cover a revision it did not test.

## Admission decision

`WEEK 2 ADMISSION: ADMITTED`

Start from `d6a25c87423d69877965d7cb1541b726c7ad3b5d` or a descendant that passes
`npm run repo -- validate baseline` and the seven required CI checks. Developer
setup begins at [developer setup](../../onboarding/developer-setup.md).

Deviations: None.

`GP-18 STATUS: COMPLETE — BASELINE FROZEN — WEEK 2 ADMITTED`
