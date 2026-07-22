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

Part II is implemented through the repository, frontend, and backend templates plus the fail-closed `npm run validate:configuration` command. See the [configuration guide](../onboarding/configuration.md) for ownership, precedence, secret boundaries, and local setup. Formatting, linting, and broader repository-wide validation remain reserved for Part III.

## Part III implementation

Part III is implemented through `.editorconfig`, `.gitattributes`, strict frontend TypeScript and ESLint settings, centralized .NET analyzer policy, `dotnet format` verification, `npm run validate:repository`, and matching CI gates. See the [repository quality standards](../engineering/repository-quality.md) for command ownership and transitional scope.
