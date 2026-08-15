# Day 5 Final Qualification

## Revision identity

- Branch: `codex/day5-gp17-final-qualification`
- Commit: the commit containing this record; resolve with
  `git log -1 --format=%H -- docs/validation/day-5/qualification.md`
- Base revision: `7153f163539ddcf8790d293f9e385c1585fb4e48`
- Working tree at handoff: clean after the qualification commit
- Qualification timestamp: 2026-08-14 (America/New_York)
- Platform: Windows 11, PowerShell 7

## Qualification result

`DAY 5 QUALIFICATION: QUALIFIED`

The exact GP-17 tree passed every local mechanical and runtime gate. GitHub Actions
run 31769426663 passed all seven authoritative jobs on the immediate operational
baseline. The GP-17 delta contains qualification evidence and its enforcement, not
application or infrastructure behavior; its local `validate repo` execution covers
the added CI path pending the normal post-commit pull-request confirmation.

## Domain results

| Domain | Result | Primary evidence |
| --- | --- | --- |
| Configuration | PASS | Template/configuration validators and documentation inventory |
| Repository | PASS | [Repository evidence](repository-validation.md) |
| Frontend | PASS | Format, static analysis, architecture, 63 tests, production build |
| Backend | PASS | Format, compiler/analyzers, Release build, 64 unit tests |
| Architecture | PASS | 20 backend tests and frontend dependency-cruiser fixtures |
| Integration | PASS | 58 classified tests against disposable PostgreSQL and Redis |
| Docker | PASS | Compose parse, image builds, runtime startup and cleanup |
| OpenAPI | PASS | Canonical generation/validation repeated successfully |
| Health | PASS | API liveness/readiness and frontend health, including reset recovery |
| Commands | PASS | Dispatcher inventory, composition, and exit propagation |
| Windows Parity | PASS | PowerShell adapter, nested/path-with-spaces and failure tests |
| CI | PASS | [GitHub Actions evidence](ci-validation.md) |
| Documentation | PASS | Semantic documentation contract and internal link validation |
| Clean Installation | PASS | [Clean-installation record](clean-installation.md) |
| Onboarding | PASS | [Developer-onboarding record](developer-onboarding.md) |
| Security | PASS | Secret safety, least-privilege CI, safe reset and process invocation |

## Requirement-to-evidence matrix

| Requirement | Owner | Implementation | Validator/command | Result |
| --- | --- | --- | --- | --- |
| Repository baseline | GP-01 | root policies | `validate:repository` | PASS |
| Environment templates | GP-02 | three `.env.example` inventories | `validate:configuration` | PASS |
| Precedence/startup validation | GP-03 | web schema and API snapshot | configuration fixtures/tests | PASS |
| Secret boundaries | GP-04 | secret policy and redaction | `validate:secrets` | PASS |
| Frontend formatting | GP-05 | Prettier policy | `format:check`, fixtures | PASS |
| Frontend static analysis | GP-06 | ESLint and strict TypeScript | `validate frontend` | PASS |
| Frontend architecture | GP-07 | dependency-cruiser rules | architecture fixtures | PASS |
| Backend compiler policy | GP-08 | central build properties/analyzers | compiler fixtures, Release build | PASS |
| Backend formatting | GP-09 | `dotnet format` policy | `backend:format:check` | PASS |
| Backend architecture | GP-10 | metadata and compiled tests | `validate:backend-architecture` | PASS |
| Integration classification | GP-11 | xUnit traits and project policy | classification validator | PASS |
| Repository validation | GP-12 | aggregate validator | `validate repo` | PASS |
| Canonical commands | GP-13 | Node dispatcher | command contract tests | PASS |
| Windows parity | GP-14 | PowerShell adapter | PowerShell command tests | PASS |
| CI merge gates | GP-15 | `.github/workflows/ci.yml` | workflow contract and run 31769426663 | PASS |
| Onboarding | GP-16 | operational documentation | documentation contract and clean run | PASS |
| Final qualification | GP-17 | this evidence package | `validate qualification` | PASS |

## Material commands and observed results

| Command | Domain | Exit | Result | Notes |
| --- | --- | ---: | --- | --- |
| `npm run repo -- doctor` | Environment | 0 | PASS | Pinned tools and Docker daemon available |
| `npm run repo -- bootstrap` | Restore | 0 | PASS | Locked npm and .NET restores from clean worktree |
| `npm run repo -- format check` | Formatting | 0 | PASS | Frontend and backend non-mutating checks |
| `npm run repo -- validate` | Static qualification | 0 | PASS | Repeated successfully on identical source |
| `npm run repo -- test` | Unit/architecture | 0 | PASS | Frontend, backend unit, and architecture suites |
| `npm run repo -- build` | Build independence | 0 | PASS | Safe public build values; no services running |
| `npm run repo -- validate docker` | Containers | 0 | PASS | Compose and all image builds |
| `npm run repo -- migrate` | Database | 0 | PASS | Fresh canonical migrations |
| `npm run backend:test:integration` | Integration | 0 | PASS | 58 tests |
| `npm run repo -- validate openapi` | OpenAPI | 0 | PASS | Repeated canonical generation |
| `npm run repo -- dev` | Runtime | 0 | PASS | Isolated full stack reached healthy state |
| `npm run repo -- health` | Health | 0 | PASS | Liveness, readiness, and web health |
| Stop isolated Redis; probe health; restart Redis | Negative health | 0 | PASS | Liveness 200, readiness 503, recovery healthy |
| Guarded then confirmed `reset-db` | Recovery | 0 | PASS | Guard returned 1; isolated reset/reapply returned 0 |
| Frontend Storybook/browser sequence | Browser | 0 | PASS | 3 Storybook tests and 14 browser assertions |
| `npm run repo -- validate qualification` | Evidence | 0 | PASS | Five records and sixteen domains |
| `npm run test:repository-commands` | Commands | 0 | PASS | Dispatcher and PowerShell parity |
| `npm run test:ci-workflow` | CI contract | 0 | PASS | Seven stable fail-closed jobs |

## Controlled failure evidence

The repository, frontend formatting/architecture/configuration, backend
compiler/architecture/classification, reset confirmation, and dispatcher
exit-propagation fixtures all detected their intended violations. Every fixture
restored or isolated its state, and the post-fixture canonical validation passed.
See [repository evidence](repository-validation.md) for commands.

## Security review

- No tracked real secret or local environment file was detected.
- CI grants only `contents: read`, exposes no repository secret, and has no
  required-gate failure suppression.
- Reset requires explicit confirmation and targets the named local Compose volume.
- PowerShell forwards argument arrays without evaluation or constructed commands.
- Frontend public configuration rejects secret-shaped names and values.
- No production connection or credential was used during qualification.

## Deviations and findings

- A literal clean operating-system installation was not performed. The clean
  worktree began without Proprium-specific state on a workstation with verified
  baseline tools.
- Windows 11 and GitHub Ubuntu are evidenced; macOS is not certified.
- The GitHub-hosted run applies to the immediate GP-16 operational revision. The
  GP-17 evidence/enforcement delta is locally qualified and awaits the routine
  post-commit PR run; it changes no runtime path.
- The first local Storybook build could not read its generated cache inside the
  filesystem sandbox. The identical command passed outside that sandbox, followed
  by all Storybook and browser checks. This was an execution-environment limitation,
  not a source change.
- One combined static/test/build shell exceeded its five-minute outer command bound
  after static validation passed. The interrupted test, build, and contract domains
  were rerun individually with explicit bounds and passed.
- During the Redis outage recovery exercise, a direct Compose restart omitted the
  alternate Redis host-port override and used the repository's default port. The
  uniquely named project did not collide with another service; subsequent reset
  and cleanup remained scoped to `proprium_gp17_qualification`.
- Migration creation remains maintainer-only until `dotnet-ef` is repository-pinned.
- Existing npm advisories and upstream deprecation notices remain non-blocking and
  were not introduced or hidden by GP-17.

No unresolved Day 5 defect was found.

## Week 2 handoff

- Certified baseline: the commit containing this qualification record
- Required commands: `doctor`, `bootstrap`, `validate`, `test`, `build`,
  `validate docker`, `migrate`, integration tests, `validate openapi`, `dev`, and
  `health` as documented in the command reference
- Required CI gates: Repository, Frontend, Backend, Integration, Docker, OpenAPI,
  and Health Validation
- Known limitations: macOS unqualified; clean OS provisioning and production
  operations remain out of Day 5 scope
- Safe to begin Week 2: YES

`GP-17 STATUS: COMPLETE — DAY 5 QUALIFIED`
