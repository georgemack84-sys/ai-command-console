# Contributing

## Operating model

This repository operates as `SOLO_MAINTAINER`. Quality expectations apply to every change; enforcement is adapted so it does not depend on unavailable reviewers or teams.

## Branches and commits

Create short-lived branches from `main` using one of:

- `feature/<description>`
- `fix/<description>`
- `docs/<description>`
- `chore/<description>`

Use conventional commits in the form `type(scope): description`. Supported types are `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `ci`, `perf`, and `security`.

## Pull requests

Open a pull request for every change to `main`. Complete the pull request template, resolve conversations, and use the merge policy in [Repository Governance](docs/engineering/repository-governance.md). UI changes should include screenshots.

Material pull requests require a completed **Solo Maintainer Review** with validation evidence, known risks, and deferred work. Empty review sections do not satisfy this requirement.

## Definition of done

For repository-governance work, completion requires documentation, appropriate validation, and a clear security impact assessment. Product features additionally require authorization, accessibility, observability, logging, testing, documentation, migrations where applicable, and operational readiness.

## Reporting security issues

Do not report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md).
