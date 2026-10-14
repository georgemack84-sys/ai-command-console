# Nuru Track 0 Baseline Qualification

**Date:** 2026-10-13
**Status:** Partially qualified — isolated Prisma migration evidence is green;
the shared development database remains on a different historical lineage and
must be rebuilt or recovered independently.

## Passing evidence

The following checks passed against the current working tree:

| Check | Result |
| --- | --- |
| Nuru/platform focused unit suite | 37 tests across 12 files passed |
| TypeScript | `npm run typecheck` passed |
| Configuration contract | `npm run validate:configuration-contract` passed |
| Lint | `npm run lint` passed |
| Legacy-state guard | `npm run check:legacy-state -- --strict` passed |
| Production build | `npm run build` passed |
| Legacy console handler support | 3 tests passed after its governed `workspaceId` contract assertion was corrected |

The full coverage-enabled `npm run test:unit` process did not produce a final
summary in this execution environment after startup. It is therefore not
accepted as passing evidence and must be run in CI or a normal developer host.

## Shared development database: historical lineage is divergent

`prisma migrate status` reports a split history after
`202608230003_authority_review_resolution`:

- The local checkout has eleven pending migrations, including the application
  registry, credentials, capabilities, capability grants, workflow identity,
  approvals, sandbox receipts, and sandbox verification migrations.
- The configured local database has eleven migrations that are absent from the
  checkout, including scope architecture, scope monitoring, Headline Flow
  event/evidence migrations, and Tandem knowledge migrations.

Do not apply the pending application-platform migrations to that database. It is
not a qualification target for this checkout; it must be rebuilt or reconciled
through a separately reviewed development-data recovery plan.

### Lineage finding

The configured database's missing migrations are present on
`codex/nuru-recovery-qualification`, which is not an ancestor of the current
`codex/phase2-scope-promotion-gate` checkout. That Nuru branch also contains a
substantial Nuru schema lineage that is absent from this checkout. Migration
reconciliation must therefore begin with a deliberate development-data recovery
plan; copying individual migration directories or marking history as applied
would produce an unreviewable schema state.

## Isolated Prisma migration qualification

A fresh local PostgreSQL database named `nuru_track0_qualification_20261013`
was created solely for this qualification. This checkout's migration chain was
applied to it, then applied a second time.

| Check | Result |
| --- | --- |
| Initial deploy | Passed |
| Migration ledger | 120 total; 0 unfinished; 0 rolled back |
| Resulting public tables | 167 |
| Repeat deploy | Passed; no pending migrations |

The disposable database is retained temporarily as evidence and must not be
treated as a shared development environment.

## Migration-ownership documentation

The EF Core and Prisma persistence surfaces now have separately scoped runbooks:
[`migrations.md`](../operations/migrations.md) for the API and
[`prisma-migrations.md`](../operations/prisma-migrations.md) for the Next.js
application platform. Each identifies its authoritative ledger and recovery
rules, and prohibits manually crossing history between the two surfaces.

## Configuration recorded for this integration

| Variable | Role | Default / constraint |
| --- | --- | --- |
| `WORKFLOW_DISPATCH_MODE` | Controls workflow egress mode | `disabled`; only `sandbox` is accepted |
| `WORKFLOW_SANDBOX_BASE_URL` | Local sandbox target | Required before sandbox verification can begin; it alone never enables dispatch |
| `WORKFLOW_STAGING_NURU_BASE_URL` | Nuru staging URL | Deployment secret only; readiness evidence, never an authorization grant |
| `WORKFLOW_STAGING_HEADLINE_FLOW_BASE_URL` | Headline Flow staging URL | Deployment secret only; readiness evidence, never an authorization grant |

## Next qualification increment

1. Run the complete unit suite in CI or a developer host and retain its result.
2. Split the current foundation into reviewable platform, workflow,
   sandbox-dispatch, and UI/observability changesets.
