# Troubleshooting

Diagnose the failing boundary before changing state. Preserve the first actionable
error, identify the owner of any process or container before stopping it, and never
bypass required gates with `--no-verify`, ignored tests, disabled analyzers, or
failure suppression.

## Prerequisites and restore

| Symptom | Likely cause | Verify | Resolution / escalation |
| --- | --- | --- | --- |
| `git` is unavailable | Git missing from `PATH` | `git --version` | Install a supported Git release and open a new shell. |
| Node is missing or wrong | `.nvmrc` major not active | `node --version`; inspect `.nvmrc` | Install/select the repository major. Do not change `.nvmrc` locally. |
| npm is unavailable | Incomplete Node installation | `npm --version` | Repair the Node installation; npm is the package manager for this workflow. |
| Wrong .NET SDK | Installed feature band differs from `global.json` | `dotnet --version`; `dotnet --list-sdks` | Install the selected feature band. Do not relax `global.json`. |
| PowerShell adapter fails | `pwsh` missing, too old, or execution policy blocks it | `pwsh --version`; `Get-ExecutionPolicy -List` | Install PowerShell 7 and use an organization-approved policy; the npm entry remains equivalent. |
| `npm ci` rejects a lockfile | Manifest/lock mismatch or unsupported npm | Read the first npm diagnostic; `git diff -- package-lock.json apps/web/package-lock.json` | Restore the committed manifest/lock pair or intentionally regenerate and review both in a dependency change. Do not delete lockfiles. |
| npm cache appears corrupt | Repeated integrity/extraction failures with an unchanged lockfile | `npm cache verify` | Run the package manager's cache verification; clear only the affected cache after confirming corruption. |
| NuGet restore fails | SDK, network, source, or cache issue | `dotnet restore services/api/Proprium.sln --verbosity normal` | Repair the reported SDK/source/network problem. Clear only an identified damaged package entry. |

Run `npm run repo -- doctor` for the full prerequisite set. It requires a reachable
Docker daemon because it qualifies the complete onboarding path.

## Docker, ports, and dependencies

| Symptom | Likely cause | Verify | Resolution / escalation |
| --- | --- | --- | --- |
| Docker command exists but operations fail | Daemon stopped or wrong context | `docker info`; `docker context show` | Start Docker or select the intended local context. |
| Compose parse fails | Invalid interpolation or YAML | `docker compose -f docker-compose.proprium.yml config` | Correct the reported key/value; start from `.env.example`. |
| Container exits or is unhealthy | Build, configuration, migration, or dependency failure | `docker compose -f docker-compose.proprium.yml ps`; `logs <service>` | Repair the first failing service, then rerun the canonical command. |
| Port `3000`, `8080`, `55432`, or `6379` is occupied | Another process or container owns the binding | Windows: `Get-NetTCPConnection -State Listen -LocalPort <port>`; Unix: `ss -ltnp` or `lsof -i :<port>`; `docker ps` | Identify the owner. Stop only your process, or use documented PostgreSQL/Redis host-port overrides. Do not kill an unidentified process. |
| PostgreSQL is not ready | Container stopped, bad local credential, damaged disposable state | Compose `ps`; `logs postgres`; `pg_isready` from the infrastructure guide | Correct `.env`/port ownership and restart. Use the documented reset only for disposable local state. |
| Redis is not ready | Container stopped or wrong port | Compose `ps`; `logs redis`; `redis-cli ping` from the infrastructure guide | Restart the local service. `FLUSHDB` clears only non-authoritative cache state and cannot repair PostgreSQL. |
| Stale containers collide | Reused project/ports from an interrupted run | `docker compose -f docker-compose.proprium.yml ps --all`; `docker ps --all` | Stop the exact named project with `npm run repo -- stop`; do not remove unrelated containers. |

## Migrations and runtime

| Symptom | Likely cause | Verify | Resolution / escalation |
| --- | --- | --- | --- |
| Migration service fails | Database unavailable, invalid migration, or incompatible disposable schema | `docker compose -f docker-compose.proprium.yml logs database-migrations`; inspect `__EFMigrationsHistory` | Fix a forward migration/configuration issue. Never edit migration history manually. Reset only disposable local data. |
| Migration appears missing/already applied | Wrong project/database or history differs from expectation | Check project name, database, and ordered `__EFMigrationsHistory` | Point to the intended local project and rerun `npm run repo -- migrate`; do not replay files manually. |
| API startup throws configuration error | Required API setting missing/invalid | `npm run validate:configuration`; compare `services/api/.env.example` | Supply the named setting through the supported provider. Do not put secrets on command lines or in tracked files. |
| API is live but readiness is `503` | PostgreSQL or Redis unavailable | Compare `/health/live` and `/health/ready`; inspect dependency logs | Restore the failing dependency; liveness alone is not setup success. |
| Frontend build fails configuration validation | Missing/invalid `NEXT_PUBLIC_*` value | Compare `apps/web/.env.example`; run `npm run test:config-build-failure` | Supply all four public build values and rebuild. Never put secrets in them. |
| Frontend cannot reach API | Wrong public API base URL or API unready | Inspect built `NEXT_PUBLIC_API_BASE_URL`; run canonical health | Correct the public URL, rebuild, and restore API readiness. |

Backend stdout, frontend terminal output, Compose logs, and the failing GitHub job
are the authoritative diagnostics. The repository does not maintain hidden log
locations for the Proprium Compose stack.

## Validation and CI

| Failed domain | Local reproduction | Correct response |
| --- | --- | --- |
| Repository | `npm run repo -- validate repo` | Fix the named tracked-file, documentation, configuration, link, or secret-policy rule. |
| Frontend | `npm run repo -- validate frontend`; `npm run repo -- build frontend` | Fix formatting, lint, types, architecture, tests, or build configuration. |
| Backend | `npm run repo -- validate backend`; `npm run backend:test:unit` | Fix format, compiler/analyzer, architecture, classification, unit, or permission drift. |
| Integration | `npm run repo -- migrate`; `npm run backend:test:integration` after the Release build | Confirm PostgreSQL/Redis readiness and fix the classified test or application defect. |
| Docker | `npm run repo -- validate docker` | Fix Compose, build context, Dockerfile, or image build. Images are not published. |
| OpenAPI | Build `Proprium.Api` Release; `npm run repo -- validate openapi` | Fix generation or contract invariants. Do not commit a competing generated artifact. |
| Health | `npm run repo -- dev`; `npm run repo -- health` | Inspect startup ordering, migration, liveness, readiness, and frontend health. |

Architecture-test failures are repository-boundary violations, not flaky tests.
Read the named rule, correct the prohibited dependency or pattern, and rerun the
architecture gate. Repeatedly rerunning CI without a diagnosed transient platform
failure is not a recovery strategy.

## Destructive recovery escalation

If PostgreSQL state is known to be disposable and forward migration cannot repair
it, use the [local database reset](database-reset.md). The command explicitly
confirms destruction and targets only a named local Compose project. It is not a
production rollback or a substitute for diagnosing migration defects.
