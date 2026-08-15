# Developer Setup

This is the authoritative path from a new checkout to a healthy Proprium Week 1
development stack. Run commands from the repository root unless stated otherwise.

## Supported environments and prerequisites

Windows 11 with PowerShell 7 is the locally certified environment. The same npm
entry point is exercised on GitHub's Ubuntu runner. macOS is not currently
certified. An IDE is optional.

| Tool | Purpose | Requirement | Version authority | Verify |
| --- | --- | --- | --- | --- |
| Git | Clone and repository policy | Required | Supported vendor release; no repository-pinned patch | `git --version` |
| Node.js | Dispatcher and frontend | Required | `.nvmrc` | `node --version` |
| npm | Locked JavaScript restore | Required; bundled with Node.js | Root and frontend lockfiles | `npm --version` |
| .NET SDK | Backend restore/build/test | Required | `global.json` | `dotnet --version` |
| Docker | PostgreSQL, Redis, API, web | Required for runtime/integration only | Docker installation | `docker --version` |
| Compose | Stack lifecycle | Required for runtime/integration only | Compose v2 plugin | `docker compose version` |
| PowerShell | Windows command adapter | Required for the Windows wrapper | PowerShell 7+ | `pwsh --version` |

Run the repository-owned full-workflow check after cloning:

```bash
npm run repo -- doctor
```

It checks Git, the exact Node major, the .NET feature band, npm, Docker CLI,
Compose, the Docker daemon, and PowerShell on Windows. Docker is not required for
ordinary restore, static validation, tests, or compilation; use the individual
version commands when preparing only those infrastructure-independent operations.

## Clone and verify

```bash
git clone https://github.com/georgemack84-sys/ai-command-console.git
cd ai-command-console
git status --short
```

An empty status is expected. The repository has no required submodules. Paths with
spaces are supported by the Node dispatcher and PowerShell adapter.

## Configure local development

Read the [configuration guide](configuration.md) before creating files. Compose
defaults are sufficient for the standard local stack, so no `.env` file is required
for first startup. A direct frontend production build still requires the four
public values from `apps/web/.env.example`; supply them through the process or an
ignored `.env.local`. If files are preferred, copy only the relevant templates:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local
```

The API does not load `services/api/.env`; that file is an inventory for explicit
process, IDE, container, or launch-profile environment values. Local files are
ignored. Never commit real secrets or place secrets in `NEXT_PUBLIC_*` values.

## Restore, validate, and build without infrastructure

Locked restore is deterministic and does not start PostgreSQL, Redis, or Docker:

```bash
npm run repo -- bootstrap
npm run repo -- format check
npm run repo -- validate
npm run repo -- test
export NEXT_PUBLIC_APP_NAME=Proprium
export NEXT_PUBLIC_APP_VERSION=local
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
export NEXT_PUBLIC_ENVIRONMENT=development
npm run repo -- build
```

On Windows the same sequence is:

```powershell
.\scripts\proprium.ps1 bootstrap
.\scripts\proprium.ps1 format check
.\scripts\proprium.ps1 validate
.\scripts\proprium.ps1 test
$env:NEXT_PUBLIC_APP_NAME = 'Proprium'
$env:NEXT_PUBLIC_APP_VERSION = 'local'
$env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080'
$env:NEXT_PUBLIC_ENVIRONMENT = 'development'
.\scripts\proprium.ps1 build
```

Success means exit code `0`. Do not delete or regenerate lockfiles to repair a
restore; diagnose the runtime, network, registry, or lockfile mismatch instead.

## Apply migrations and start the applications

Docker Compose owns local PostgreSQL, Redis, the one-shot migration runner, the
API, and the frontend. Apply migrations explicitly, then start the complete stack:

```bash
npm run repo -- migrate
npm run repo -- dev
npm run repo -- health
```

```powershell
.\scripts\proprium.ps1 migrate
.\scripts\proprium.ps1 dev
.\scripts\proprium.ps1 health
```

`migrate` starts the required dependencies, applies every pending versioned
migration, and exits non-zero on failure. `dev` builds and starts the full Compose
stack and waits for health. It safely reruns the idempotent migration service before
the API. `health` verifies:

- API liveness: `http://localhost:8080/api/v1/health/live`;
- API readiness, including PostgreSQL and Redis:
  `http://localhost:8080/api/v1/health/ready`; and
- frontend health: `http://localhost:3000/health`.

Liveness proves the API process can respond. Readiness proves its required
dependencies are usable. A process may therefore be live but not ready.

The supported backend and frontend startup command is the full `dev` stack. For
focused diagnostics, Compose can target `platform-api` or `web`, but their declared
dependencies and migration ordering still apply. Terminal output and `docker
compose -f docker-compose.proprium.yml logs` are the startup logs.

## Baseline tests and CI reproduction

The infrastructure-independent test command covers frontend/backend units and
backend architecture tests:

```bash
npm run repo -- test
```

Integration tests require healthy PostgreSQL and Redis plus a Release build:

Load the values from `services/api/.env.example` into the current process first;
the API intentionally does not auto-load that inventory file. If root Compose
ports were overridden, set `POSTGRES_PORT` and `REDIS_PORT` to those host ports.
For Bash, `set -a; . services/api/.env.example; set +a` imports the example
contract. In PowerShell, set the same names with `$env:<NAME> = '<value>'`.

```bash
dotnet build services/api/Proprium.IntegrationTests/Proprium.IntegrationTests.csproj --configuration Release --no-restore
npm run backend:test:integration
```

Use the [command reference](../engineering/repository-commands.md) for every GP-15
CI domain, Storybook/browser checks, Docker builds, and OpenAPI validation.

## Shutdown and recovery

Stop the stack while retaining PostgreSQL data:

```bash
npm run repo -- stop
```

```powershell
.\scripts\proprium.ps1 stop
```

See [local infrastructure](../operations/local-infrastructure.md),
[migrations](../operations/migrations.md),
[database reset](../operations/database-reset.md), and
[troubleshooting](../operations/troubleshooting.md). Follow the formal
[clean-machine procedure](clean-machine-validation.md) when certifying onboarding.
