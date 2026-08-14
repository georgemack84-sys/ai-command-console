# GP-13 Canonical Repository Commands

## Contract

GP-13 establishes the repository-owned command facade used for routine Proprium
engineering work. The authoritative syntax is:

```text
npm run repo -- <command> [category]
```

The npm script invokes `scripts/proprium-command.cjs`, a dependency-free Node.js
dispatcher. It owns repository paths, fixed command ordering, stage logging, child
process exit-code propagation, and inherited tool diagnostics. The facade invokes
only repository scripts, package-local binaries, and the SDK selected by
`global.json`; no global JavaScript tools or orchestration framework are required.

The existing Makefile remains a compatibility entry point for the earlier
operational command set. The [GP-14 Windows parity specification](gp-14-windows-command-parity.md)
defines the PowerShell adapter for this complete command surface. New automation
should use the authoritative npm syntax; Windows developers may use either entry
point with the same command semantics.

## Command reference

| Command | Mutation | Infrastructure | Purpose and underlying category | Typical use |
| --- | --- | --- | --- | --- |
| `npm run repo -- validate repo` | None | None | GP-12 repository structure and policy | After repository/configuration changes |
| `npm run repo -- validate frontend` | Ignored reports only | None | GP-05-GP-07 frontend format checks, static analysis, architecture, and unit validation | After frontend changes |
| `npm run repo -- validate backend` | Build artifacts only | None | GP-08-GP-11 formatting, compiler policy, Release build/analyzers, architecture, and test classification | After backend changes |
| `npm run repo -- validate test-classification` | Test artifacts only | None | GP-11 test-category and filter contract | Troubleshooting classification failures |
| `npm run repo -- validate` | Ignored build/test artifacts only | None | Repository, frontend, then backend validation | Required source-validation check before review |
| `npm run repo -- format frontend` | Source | None | Apply frontend Prettier formatting | Before committing frontend edits |
| `npm run repo -- format backend` | Source | None | Apply bounded .NET whitespace/style formatting | Before committing backend edits |
| `npm run repo -- format` | Source | None | Apply frontend, then backend formatting | Format all supported source |
| `npm run repo -- format check` | None | None | Check frontend and backend formatting | Non-mutating formatting gate |
| `npm run repo -- build frontend` | Build artifacts | None | Build the frontend using its locked package scripts | Qualify a frontend build |
| `npm run repo -- build backend` | Build artifacts | None | Restore as needed and build the backend in Release | Qualify a backend build |
| `npm run repo -- build` | Build artifacts | None | Build frontend, then backend | Qualify both applications |
| `npm run repo -- test unit` | Test artifacts | None | Frontend and backend unit suites; excludes architecture and integration | Focused unit testing after a build |
| `npm run repo -- test architecture` | Test artifacts | None | GP-10 backend architecture suite | Focused architecture testing after a build |
| `npm run repo -- test` | Test artifacts | None | Unit, then architecture suites; excludes integration | Run every currently safe test category |

`validate`, `build`, and `test` never start Docker, PostgreSQL, Redis, the API, or
the frontend server. Integration execution remains explicit and non-canonical at
this checkpoint because it requires infrastructure. Direct low-level commands are
available for diagnosis, but they do not redefine the completion contract above.

## Prerequisites and behavior

Run commands from the repository root. Bootstrap dependencies separately with the
existing deterministic workflow before validation:

```text
npm run repo -- bootstrap
```

Validation does not install packages or restore dependencies implicitly. In
particular, backend validation uses `--no-restore` and the compiled test commands
use `--no-build --no-restore`; run `build backend` first in a clean checkout.
Frontend build may require the non-secret configuration inputs documented by the
frontend environment validator. The frontend build child runs with
`NODE_ENV=production`, as required by Next.js, without changing the caller's
environment.

Grouped commands run sequentially and fail at the first required child failure.
A failing or missing executable returns non-zero, the underlying output remains
visible, and required gates accept no skip flags. Unknown commands also return
non-zero; use `npm run repo -- --help` for the current command list.

The canonical pre-review workflow is:

```text
npm run repo -- format check
npm run repo -- validate
```

Future CI jobs may split repository, frontend, and backend validation for runtime
efficiency, but each job must invoke the same category command documented here.

## GP-13 evidence

`npm run test:repository-commands` proves the stable command inventory, fixed root
validation order, category separation, non-mutating format-check dispatch, missing
tool diagnostics, rejection of unsupported arguments, and fail-fast propagation of
a child exit code. Live qualification covers each infrastructure-independent
category without starting application or infrastructure processes.
