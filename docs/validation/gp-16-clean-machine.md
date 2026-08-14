# GP-16 Clean-Machine and Onboarding Evidence

## Candidate

- Date: 2026-08-14 (America/New_York)
- Platform: Windows 11, PowerShell 7
- Repository tree/revision: the commit containing this record; resolve it with
  `git log -1 --format=%H -- docs/validation/gp-16-clean-machine.md`
- Base commit: `3e7f772ccafaf8a1ba536147f4189da095c2c6c2`
- Scope: clean checkout with baseline tools installed; no copied Proprium
  dependencies, environment files, containers, volumes, or aliases

## Runtime versions

`npm run repo -- doctor` reported Git 2.53.0.windows.2, Node.js 24.13.1,
npm 11.8.0, .NET SDK 8.0.424, Docker CLI and daemon 29.6.2, Docker Compose
5.3.1, and PowerShell 7.6.3. Version authority remains `.nvmrc`, `global.json`,
lockfiles, and `Directory.Packages.props` rather than this historical record.

## Commands executed

| Phase | Command | Result | Notes |
| --- | --- | --- | --- |
| Candidate preparation | Documentation and command inventory | PASS | Existing guides, scripts, templates, Compose, migrations, health, and CI were inspected before editing. |
| Prerequisites | `npm run repo -- doctor` | PASS | All required tools, pinned runtime bands, Compose, and the Docker daemon were available. |
| Clean restore | `npm run repo -- bootstrap` | PASS | Began without dependency trees or Proprium environment files; all locked restores completed. |
| Static validation | `npm run repo -- format check`; `npm run repo -- validate`; `npm run repo -- test` | PASS | Repository/documentation, frontend, backend, unit, architecture, and classification gates passed before infrastructure startup. |
| Frontend build configuration discovery | `npm run repo -- build` without public values | EXPECTED FAIL | Build failed closed and identified all four missing `NEXT_PUBLIC_*` values. Setup entry points were corrected to supply them explicitly without an environment file. |
| Infrastructure-independent build retry | Set four public process values; `npm run repo -- build` | PASS | Frontend production build and backend Release build passed without infrastructure. |
| Docker | `npm run repo -- validate docker` | PASS | Compose parsed and every application image built without starting services. |
| Migration | `npm run repo -- migrate` | PASS | The one-shot owner succeeded twice against `proprium_gp16_certification`, proving fresh application and idempotence. |
| Integration | Release build; `npm run backend:test:integration` | PASS | 58 of 58 integration tests passed against isolated PostgreSQL and Redis. |
| OpenAPI | API Release build; `npm run repo -- validate openapi` | PASS | Generation and validation passed with temporary output only. |
| Health | `npm run repo -- dev`; `npm run repo -- health` | PASS | Live, ready, and web checks passed for the full isolated stack. |
| Reset | Unconfirmed and confirmed reset commands; post-reset health | PASS | Guard rejection, isolated volume recreation, migration, and all health checks passed. |
| Documentation | `npm run repo -- validate documentation`; repository validation | PASS | Ten authoritative documents plus command, template, and link contracts passed. |

## Recovery scenarios

| Scenario | Documented diagnosis and recovery | Result |
| --- | --- | --- |
| Destructive reset lacks confirmation | Dispatcher must refuse before invoking Docker; rerun only after inspecting the local target | PASS |
| Invalid frontend build configuration | Existing failure fixture proves configuration fails closed; correct values come from the frontend template | PASS |
| Fresh database has no schema | One-shot migration owner applied all four versions; ordered EF history was verified | PASS |
| Isolated stack restart/reset | Named project and alternate data-store ports prevented interference with unrelated containers | PASS |

## Onboarding discovery review

The root README points to one authority each for setup, configuration, commands,
infrastructure, migrations, reset, troubleshooting, and certification. No Slack,
private note, ChatGPT history, shell alias, personal path, IDE, or production secret
is required. A discovery review and the semantic documentation validator both
passed. The unrelated `ai-command-console-postgres` container on port 55432
remained healthy after the isolated project and its volume were removed.

## Deviations and pre-existing findings

- The first documented build attempt omitted required public frontend values. The
  environment validator failed closed; documentation was corrected before retry.
- Two manual integration attempts used incomplete process configuration before
  the full API template contract was supplied; the canonical template was correct,
  and the final 58-test run passed.
- A literal clean operating-system installation was not performed; baseline tool
  installation is documented and tool versions are mechanically checked.
- macOS is not certified.
- Migration creation remains maintainer-only until `dotnet-ef` is pinned in a
  repository tool manifest. Migration application is fully certified.
- The retained legacy root application and root Compose file remain transitional;
  they are explicitly excluded from the Proprium Day 5 startup authority.
- Locked npm restores reported pre-existing advisories (34 at the root and 12 in
  `apps/web`) plus upstream deprecation notices; GP-16 did not change dependencies.

## Final status

`CLEAN-MACHINE CERTIFICATION: PASS WITH DOCUMENTED PLATFORM LIMITATIONS`

`GP-16 STATUS: COMPLETE WITH DOCUMENTED ENVIRONMENT LIMITATIONS`
