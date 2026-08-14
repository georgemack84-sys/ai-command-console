# Repository Command Reference

## Entry points

`scripts/proprium-command.cjs` is the single implementation. Run it through npm
from the repository root:

```bash
npm run repo -- <command>
```

Windows PowerShell 7 uses the argument-safe adapter from any directory:

```powershell
.\scripts\proprium.ps1 <command>
```

Both entry points preserve ordering, diagnostics, and non-zero child exit codes.
Run `npm run repo -- --help` or `.\scripts\proprium.ps1 help` for the live
inventory. Commands do not accept flags that suppress required gates.

## Prerequisites and lifecycle

| Capability | npm / Unix-like shell | PowerShell 7+ | Infrastructure | Mutation | Success |
| --- | --- | --- | --- | --- | --- |
| Verify full prerequisites | `npm run repo -- doctor` | `.\scripts\proprium.ps1 doctor` | Docker daemon is checked | None | Tools and pinned runtime bands pass |
| Locked restore | `npm run repo -- bootstrap` | `.\scripts\proprium.ps1 bootstrap` | None; network/package registries required | Dependency/build caches | All three restores exit `0` |
| Start complete stack | `npm run repo -- dev` | `.\scripts\proprium.ps1 dev` | Docker | Containers, images, network, PostgreSQL volume | Compose services are healthy |
| Start Storybook | `npm run repo -- storybook` | `.\scripts\proprium.ps1 storybook` | None | Local Storybook cache/output | Storybook development server starts |
| Stop stack | `npm run repo -- stop` | `.\scripts\proprium.ps1 stop` | Docker | Stops/removes containers and network; retains volume | Compose exits `0` |
| Apply migrations | `npm run repo -- migrate` | `.\scripts\proprium.ps1 migrate` | Docker | Starts dependencies; changes schema/data | Migration service exits `0` |
| Verify health | `npm run repo -- health` | `.\scripts\proprium.ps1 health` | Running full stack | None | Three health URLs return success |
| Reset local database | `npm run repo -- reset-db --force` | `.\scripts\proprium.ps1 reset-db -Force` | Docker | **Deletes named local volumes**, rebuilds stack | Recreated stack is healthy |
| Export permissions | `npm run repo -- export-permissions` | `.\scripts\proprium.ps1 export-permissions` | None; restored backend | Rewrites committed permission catalog | Export exits `0` |

The reset operation is described in the
[database-reset guide](../operations/database-reset.md). Do not use it for shared
or production data.

## Validation

All validation commands are non-mutating except for ignored build/test output.
They fail non-zero at the first required child failure.

| Capability | npm / Unix-like shell | PowerShell 7+ | Infrastructure |
| --- | --- | --- | --- |
| Full source gate | `npm run repo -- validate` | `.\scripts\proprium.ps1 validate` | None |
| Repository and documentation | `npm run repo -- validate repo` | `.\scripts\proprium.ps1 validate repo` | None |
| Developer documentation only | `npm run repo -- validate documentation` | `.\scripts\proprium.ps1 validate documentation` | None |
| Day 5 qualification evidence | `npm run repo -- validate qualification` | `.\scripts\proprium.ps1 validate qualification` | None |
| Frozen baseline and Week 2 admission | `npm run repo -- validate baseline` | `.\scripts\proprium.ps1 validate baseline` | None |
| Frontend | `npm run repo -- validate frontend` | `.\scripts\proprium.ps1 validate frontend` | None |
| UI foundation | `npm run repo -- validate ui-foundation` | `.\scripts\proprium.ps1 validate ui-foundation` | None |
| Core components | `npm run repo -- validate components` | `.\scripts\proprium.ps1 validate components` | None |
| Backend | `npm run repo -- validate backend` | `.\scripts\proprium.ps1 validate backend` | None |
| Test classification | `npm run repo -- validate test-classification` | `.\scripts\proprium.ps1 validate test-classification` | None |
| Compose and image builds | `npm run repo -- validate docker` | `.\scripts\proprium.ps1 validate docker` | Docker engine; no running services |
| CI-owned OpenAPI contract | `npm run repo -- validate openapi` | `.\scripts\proprium.ps1 validate openapi` | None; API Release build required |

`npm run validate:documentation` is the low-level semantic documentation check.
The repository gate also validates Markdown structure and internal links,
configuration/template consistency, tracked-file policy, and secret safety.

## Formatting, build, and test

| Capability | npm / Unix-like shell | PowerShell 7+ | Infrastructure | Mutation |
| --- | --- | --- | --- | --- |
| Check formatting | `npm run repo -- format check` | `.\scripts\proprium.ps1 format check` | None | None |
| Apply all formatting | `npm run repo -- format` | `.\scripts\proprium.ps1 format` | None | **Changes source** |
| Apply frontend formatting | `npm run repo -- format frontend` | `.\scripts\proprium.ps1 format frontend` | None | **Changes frontend source** |
| Apply backend formatting | `npm run repo -- format backend` | `.\scripts\proprium.ps1 format backend` | None | **Changes backend source** |
| Build both apps | `npm run repo -- build` | `.\scripts\proprium.ps1 build` | None | Ignored build output |
| Build frontend | `npm run repo -- build frontend` | `.\scripts\proprium.ps1 build frontend` | None | Ignored build output |
| Build backend | `npm run repo -- build backend` | `.\scripts\proprium.ps1 build backend` | None | Ignored build output |
| Build Storybook | `npm run repo -- build storybook` | `.\scripts\proprium.ps1 build storybook` | None | Ignored static Storybook output |
| Safe tests | `npm run repo -- test` | `.\scripts\proprium.ps1 test` | None | Ignored test output |
| Unit tests | `npm run repo -- test unit` | `.\scripts\proprium.ps1 test unit` | None | Ignored test output |
| Architecture tests | `npm run repo -- test architecture` | `.\scripts\proprium.ps1 test architecture` | None | Ignored test output |

Architecture failures represent prohibited dependency or ownership relationships;
they are not optional tests to skip.

## GP-15 CI reproduction

Restore dependencies before using commands whose scripts specify `--no-restore` or
`--no-build`.

| CI gate | Local reproduction |
| --- | --- |
| Repository Validation | `npm run repo -- validate repo`; `npm run test:repository-commands`; `npm run test:ci-workflow` |
| Frontend Validation | `npm run repo -- validate frontend`; `npm run repo -- build frontend`; `npm run repo -- build storybook`; then `npm run test:storybook`, `npm run test:browser`, and `npm run test:config-build-failure` from `apps/web` |
| Backend Validation | `npm run repo -- validate backend`; `npm run backend:test:unit`; export permissions and verify no diff |
| Integration Validation | Load the API template values into the process; build `Proprium.IntegrationTests` Release; `npm run repo -- migrate`; `npm run backend:test:integration`; always clean the disposable Compose project |
| Docker Validation | `npm run repo -- validate docker` |
| OpenAPI Validation | Build `Proprium.Api` Release; `npm run repo -- validate openapi` |
| Health Validation | `npm run repo -- dev`; `npm run repo -- health`; verify PostgreSQL persistence across restart; stop/clean the disposable project |

Local green strongly predicts CI green because the same repository-owned commands
run in both environments. GitHub Actions remains the authoritative merge record.
OpenAPI generation writes only to a temporary directory; do not commit a competing
generated contract.

## Low-level diagnostic commands

Use these to isolate a failure, not to replace the canonical gates:

- frontend: `npm run lint`, `npm run typecheck`, `npm run architecture`, and
  `npm run test:coverage` from `apps/web`;
- backend: `npm run backend:format:check`, `npm run backend:test:architecture`,
  `npm run backend:test:unit`, and `npm run backend:test:integration` from the
  root;
- infrastructure: `docker compose -f docker-compose.proprium.yml ps` and
  `docker compose -f docker-compose.proprium.yml logs <service>`.

`lint` remains a compatibility command, but `validate` is the complete canonical
source gate.
