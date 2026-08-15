# Proprium Phase 1, Week 1, Day 5: Engineering Platform Standards

**Version:** 1.0 (Canonical)  
**Status:** Implementation specification — Part I-A complete

## Purpose

Day 5 standardizes the engineering platform so a clean workstation or CI runner can configure, build, validate, test, and execute Proprium using repository-owned procedures only. It turns the foundations from Days 1–4 into a reproducible, mechanically enforced workflow.

## Objectives

- Standardize configuration ownership, templates, validation, precedence, and secret boundaries.
- Provide stable repository commands with Windows-compatible PowerShell equivalents.
- Mechanically enforce formatting, linting, static analysis, compilation, architecture rules, repository consistency, and documentation consistency where practical.
- Make CI the canonical, developer-reproducible pull-request validation environment.
- Provide onboarding and troubleshooting documentation without relying on tribal knowledge.
- Keep validation deterministic under equivalent supported environments.

## Scope

Day 5 includes configuration templates and validation; repository standards; frontend and backend tooling; repository validation; development commands; CI; and developer documentation. It excludes production deployment, cloud infrastructure, Kubernetes, production secrets, release automation, performance/security testing, gRPC, and feature work unrelated to tooling.

## Normative principles

1. Configuration is declarative, explicit, documented, and has one owner.
2. Real secrets remain external to source control; committed examples are visibly non-production.
3. Repository tooling, not IDE settings, is canonical.
4. Local validation and CI invoke the same repository-owned logic; CI has no hidden checks.
5. Restore and compilation remain independent of PostgreSQL, Redis, Docker, local `.env` files, credentials, and running services.
6. Required validation fails closed.
7. Source, compilation, unit, architecture, integration, and container validation remain distinct responsibilities.
8. Documentation is a required engineering deliverable.

## Required deliverables

- Root, frontend, and backend environment templates; precedence and secret-management specifications; validation model.
- `.editorconfig`, `.gitattributes`, `.gitignore`, formatting/linting rules, and repository validation rules.
- Frontend and backend quality tooling, including dependency and integration-classification checks.
- Root development commands and PowerShell equivalents.
- CI workflows for repository, frontend, backend, integration, Docker, OpenAPI, and health validation.
- Setup, migration, database-reset, command-reference, troubleshooting, and clean-machine guides.

## Part I-A exit criteria

The purpose, measurable objectives, scope, exclusions, architectural principles, deliverables, and fail-closed validation philosophy are established as normative Day 5 requirements.

## Next specification installment

Part I-B / Part II will define the concrete environment-template keys, configuration precedence, secret-management boundaries, build-time configuration validation, and ownership rules. Those details must be implemented only from that finalized installment; this charter intentionally does not invent them.

## Part II implementation

Part II is implemented through the repository, frontend, and backend templates plus the fail-closed `npm run validate:configuration` command. See the [configuration guide](../onboarding/configuration.md) for ownership, inventory, secret boundaries, and local setup. Formatting, linting, and broader repository-wide validation remain reserved for Part III.

The GP-02 template inventory and its transitional root boundary are frozen in the [environment-template specification](../engineering/gp-02-environment-templates.md). Configuration precedence remains deferred to GP-03.

GP-03 is implemented through the [configuration precedence specification](../engineering/gp-03-configuration-precedence.md), the strict frontend environment boundary, and the API's typed startup snapshot and deterministic validation tests.

GP-04 is implemented through the [secret-safety specification](../engineering/gp-04-secret-safety.md), focused tracked-content validation, redacted secret-bearing representations, and secret-safe API logging.

GP-05 is implemented through the [frontend-formatting specification](../engineering/gp-05-frontend-formatting.md), the locked Prettier configuration and commands in `apps/web`, explicit generator ownership, and temporary-fixture contract verification.

GP-06 is implemented through the [frontend static-analysis specification](../engineering/gp-06-frontend-static-analysis.md), strict non-emitting TypeScript validation, zero-warning ESLint policy, deterministic import rules, type-aware source checks, and disposable negative fixtures.

GP-07 is implemented through the [frontend architecture specification](../engineering/gp-07-frontend-architecture.md), the locked dependency-cruiser configuration, TypeScript-alias-aware layer rules, circular and upward-dependency failures, and isolated positive and negative fixtures.

GP-08 is implemented through the [backend compiler specification](../engineering/gp-08-backend-compiler-standards.md), centralized nullable and warnings-as-errors policy, a fixed .NET 8 SDK-analyzer level, evaluated-property enforcement, suppression auditing, and isolated compiler/analyzer fixtures.

GP-09 is implemented through the [backend formatting specification](../engineering/gp-09-backend-formatting.md), the SDK-bundled `dotnet format`, explicit C# whitespace policy, bounded write/check commands, stable source-controlled migration handling, and disposable drift/idempotence verification.

GP-10 is implemented through the [backend architecture specification](../engineering/gp-10-backend-architecture.md), an exact project-reference matrix, framework and namespace isolation, compiled dependency and service-location rules, and controlled negative fixtures for both metadata and compiled enforcement.

GP-11 is implemented through the [integration-test classification specification](../engineering/gp-11-integration-test-classification.md), the repository-owned integration marker, xUnit category filters, exact compiled infrastructure evidence, explicit test-project/package policy, and controlled negative classification fixtures.

GP-12 is implemented through the [repository-validation specification](../engineering/gp-12-repository-validation.md), the canonical non-mutating Node.js validator, stable aggregate `RVAL-*` diagnostics, tracked-file and structured-text policy, configuration/package/project consistency checks, composed environment and secret validation, and isolated negative fixtures.

GP-15 is implemented through the [CI merge-gate specification](../engineering/gp-15-ci-merge-gates.md), seven stable GitHub Actions job domains, repository-owned local reproduction commands, deterministic runtime setup, bounded infrastructure workflows, fail-closed cleanup, and a mechanical workflow contract validator.

GP-16 is implemented through the [developer-onboarding specification](../engineering/gp-16-developer-onboarding.md), an authoritative setup entry point, prerequisite doctor, canonical operational guides, semantic documentation validation, and clean-machine certification evidence.

GP-17 is implemented through the [final-qualification specification](../engineering/gp-17-final-qualification.md), a traceable evidence package, mechanical qualification validation, observed CI results, controlled fail-closed evidence, and the Week 2 handoff baseline.

GP-18 is a derived transition control implemented through the [baseline-freeze specification](../engineering/gp-18-baseline-freeze.md), the immutable GP-17 revision identity, a protected-contract inventory, mechanical drift checks, an amendment protocol, and the [Week 2 admission record](../validation/day-5/week-2-admission.md). It preserves the canonical Day 5 scope rather than adding another deliverable category.

## Part III implementation

Part III is implemented through `.editorconfig`, `.gitattributes`, strict frontend TypeScript and ESLint settings, centralized .NET analyzer policy, `dotnet format` verification, `npm run validate:repository`, and matching CI gates. See the [repository quality standards](../engineering/repository-quality.md) for command ownership and transitional scope.

The GP-01 portion is frozen in the [repository baseline](../engineering/gp-01-repository-baseline.md). It qualifies root file policy and tracked artifacts without expanding into environment schemas, language-tooling changes, renormalization, or CI orchestration.
