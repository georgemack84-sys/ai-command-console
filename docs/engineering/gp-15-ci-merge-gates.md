# GP-15 Continuous Integration Merge Gates

## Architecture

`.github/workflows/ci.yml` is the single pull-request and protected-`main` workflow.
It contains seven independent jobs with stable names suitable for branch protection:

```text
Repository Validation
Frontend Validation
Backend Validation
Integration Validation
Docker Validation
OpenAPI Validation
Health Validation
```

The jobs are independent because each clean GitHub-hosted runner must restore or
build its own domain. Artificial `needs` chains would delay feedback without
sharing runner state. Every job uses a bounded timeout. Workflow concurrency is
scoped to the pull request number or ref and cancels only obsolete runs for that
same change.

The workflow runs for `pull_request`, pushes to `main`, and manual dispatch. It uses
only `contents: read`, does not use `pull_request_target`, grants no write access,
references no repository secrets, and contains no required `continue-on-error` or
failure-suppression path. Fork pull requests therefore execute without privileged
credentials.

## Validation mapping

| Domain | Repository-owned CI command | Additional bounded orchestration | Infrastructure |
| --- | --- | --- | --- |
| Repository | `npm run repo -- validate repo` | Command and workflow contract tests | None |
| Frontend | `npm run repo -- validate frontend`; `build frontend` | Locked install plus existing Storybook/browser/configuration tests | None |
| Backend | `npm run repo -- validate backend`; `npm run backend:test:unit` | Locked restore and permission-catalog freshness | None |
| Integration | `npm run repo -- migrate`; `npm run backend:test:integration` | Restore/build, failure logs, unconditional volume cleanup | Ephemeral PostgreSQL and Redis |
| Docker | `npm run repo -- validate docker` | Compose config and image builds only; no publication | Docker engine |
| OpenAPI | `npm run repo -- validate openapi` | Restore/build `Proprium.Api` | None |
| Health | `npm run repo -- dev`; `npm run repo -- health` | Persistence restart proof, failure logs, unconditional cleanup | Ephemeral full Compose stack |

Repository, frontend, backend, Docker, and OpenAPI rules live in repository scripts
or package commands. The integration and health YAML contains only lifecycle
orchestration whose local equivalents use the same Compose file and commands.
Compose health checks and `--wait` provide bounded readiness; no arbitrary sleep is
used. The one-shot `database-migrations` service remains the only schema authority.

## Determinism and generated output

`.nvmrc` pins the Node.js 24 major used by every Node job. `global.json` pins the
.NET 8 feature band. npm jobs use `npm ci` with the applicable lockfile and .NET jobs
restore before building with `--no-restore`. Caches contain downloads only and are
never treated as build outputs.

OpenAPI remains CI-owned. `validate-openapi-generation.cjs` invokes the backend's
existing `--write-openapi` path, writes to a unique OS temporary directory, validates
the JSON and required contract invariants, and removes the directory on success or
failure. Proprium currently has no committed generated OpenAPI artifact, so GP-15
validates deterministic generation and policy invariants rather than fabricating a
source-drift comparison or mutating the pull request.

## Mechanical workflow contract

`npm run test:ci-workflow` parses the workflow and fails unless all seven stable
jobs, triggers, least-privilege permissions, scoped cancellation, positive timeouts,
canonical commands, and unconditional infrastructure cleanup remain present. It
also rejects `pull_request_target`, `continue-on-error`, `|| true`, secret references,
and write permissions. GP-12 separately validates YAML syntax and tracked repository
policy.

## Validation record

The GitHub Actions run attached to each pull request or protected-branch revision is
the authoritative CI record. It records the workflow revision, seven job statuses,
runtime setup, exact command output, test results, readiness diagnostics, and cleanup
status. Local execution can qualify the implementation but must not be represented
as a GitHub-hosted result. Branch protection should require the seven stable job
names above after this workflow has completed successfully on its target branch.
