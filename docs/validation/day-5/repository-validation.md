# Day 5 Repository-Validation Evidence

## Positive qualification

| Command | Scope | Result |
| --- | --- | --- |
| `npm run repo -- validate repo` | Structure, structured text, configuration, secrets, documentation, qualification evidence | PASS |
| `npm run repo -- validate` | Repository, frontend, backend, architecture, classification | PASS |
| `npm run test:repository-commands` | Dispatcher and PowerShell parity | PASS |
| `npm run test:ci-workflow` | CI governance and command mapping | PASS |
| `git diff --check` | Whitespace integrity | PASS |

The final exact-tree rerun is recorded in
[the qualification report](qualification.md). Repository validation is
non-mutating and fails on aggregate policy diagnostics. The staged GP-17 candidate
reported 7,061 tracked paths and 42 required files. Command parity passed 16 of 16
tests, including nested invocation, path-with-spaces handling, and non-zero failure
propagation.

## Controlled failure evidence

Repository-owned disposable fixtures intentionally exercise failure paths and
exit successfully only when the target validator rejects the temporary defect:

| Domain | Fixture command | Expected validator behavior | Result |
| --- | --- | --- | --- |
| Repository | `npm run repository:fixtures` | Reject malformed/forbidden repository state | PASS |
| Frontend formatting | `npm run format:verify` in `apps/web` | Reject formatting drift and prove idempotence | PASS |
| Frontend architecture | `npm run architecture:fixtures:failing` in `apps/web` | Reject named prohibited dependencies | PASS |
| Backend compiler | `npm run backend:compiler:fixtures` | Reject compiler/analyzer violations | PASS |
| Backend architecture | `npm run backend:architecture:fixtures` | Reject project and compiled-boundary violations | PASS |
| Test classification | `npm run backend:test-classification:fixtures` | Reject misclassified infrastructure evidence | PASS |
| Frontend configuration | `npm run test:config-build-failure` in `apps/web` | Reject missing/invalid public configuration | PASS |

Fixtures use temporary directories or intentionally failing fixture trees. They do
not alter tracked source, secrets, global tooling, or persistent infrastructure.
Required child exit codes propagate through the Node dispatcher and PowerShell
adapter; command tests also prove an injected child status is returned unchanged.

`REPOSITORY VALIDATION: PASS`
