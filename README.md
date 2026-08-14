# Proprium

Proprium is a production-minded application foundation with a Next.js frontend,
an ASP.NET Core API, PostgreSQL persistence, Redis caching, versioned migrations,
and repository-owned validation. The current Week 1 platform lives in `apps/web`
and `services/api`. Older root application code remains transitional and does not
define the Proprium developer workflow.

## Start here

The supported development environments are Windows 11 with PowerShell 7 and the
Unix-like shell used by GitHub's Ubuntu runners. macOS has not yet been certified.
Install Git, the Node.js version selected by `.nvmrc`, the .NET SDK selected by
`global.json`, and Docker with Compose v2.

From a fresh clone:

```bash
npm run repo -- doctor
npm run repo -- bootstrap
npm run repo -- validate
export NEXT_PUBLIC_APP_NAME=Proprium
export NEXT_PUBLIC_APP_VERSION=local
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
export NEXT_PUBLIC_ENVIRONMENT=development
npm run repo -- build
npm run repo -- dev
npm run repo -- health
```

`bootstrap`, `validate`, and `build` do not require running PostgreSQL, Redis, or
Docker services. `doctor` verifies the full-workflow prerequisites, including the
Docker daemon. `dev` builds the isolated Compose stack, applies migrations through
the one-shot migration service, and starts the API and web application. `health`
verifies API liveness, dependency readiness, and frontend health.

On Windows, the equivalent repository-owned interface is:

```powershell
.\scripts\proprium.ps1 doctor
.\scripts\proprium.ps1 bootstrap
.\scripts\proprium.ps1 validate
$env:NEXT_PUBLIC_APP_NAME = 'Proprium'
$env:NEXT_PUBLIC_APP_VERSION = 'local'
$env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080'
$env:NEXT_PUBLIC_ENVIRONMENT = 'development'
.\scripts\proprium.ps1 build
.\scripts\proprium.ps1 dev
.\scripts\proprium.ps1 health
```

## Authoritative developer documentation

- [Developer setup](docs/onboarding/developer-setup.md)
- [Configuration and secret boundaries](docs/onboarding/configuration.md)
- [Repository command reference](docs/engineering/repository-commands.md)
- [Local infrastructure](docs/operations/local-infrastructure.md)
- [Database migrations](docs/operations/migrations.md)
- [Local database reset](docs/operations/database-reset.md)
- [Troubleshooting](docs/operations/troubleshooting.md)
- [Clean-machine validation](docs/onboarding/clean-machine-validation.md)
- [Day 5 qualification](docs/validation/day-5/qualification.md)
- [Week 2 foundation admission](docs/validation/day-5/week-2-admission.md)
- [Week 2 UI foundation roadmap](docs/roadmaps/week-2.md)
- [GP-19 UI foundation](docs/engineering/gp-19-ui-foundation.md)
- [GP-16 certification evidence](docs/validation/gp-16-clean-machine.md)

Run `npm run repo -- validate repo` to check repository policy, Markdown links,
configuration consistency, secret safety, and the developer-documentation
contract. Run `npm run repo -- validate` for the full infrastructure-independent
source gate. The [GP-15 CI specification](docs/engineering/gp-15-ci-merge-gates.md)
maps every GitHub merge gate to a local reproduction path.

The [GP-18 baseline freeze](docs/engineering/gp-18-baseline-freeze.md) preserves
the exact GP-17-qualified revision and defines foundation change classification,
requalification, and Week 2 admission. Run `npm run repo -- validate baseline`
before and after intentional changes to the engineering foundation.

Week 2 UI work inherits that baseline through the [GP-19 UI foundation](docs/engineering/gp-19-ui-foundation.md).
Use `npm run repo -- validate ui-foundation` for tokens, themes, and Storybook
parity; start Storybook with `npm run repo -- storybook` and build it with
`npm run repo -- build storybook`.

## Local endpoints

The Compose-owned development stack exposes:

| Service | URL or port | Authority |
| --- | --- | --- |
| Web | `http://localhost:3000` | `docker-compose.proprium.yml` |
| API | `http://localhost:8080/api/v1` | `docker-compose.proprium.yml` |
| API liveness | `http://localhost:8080/api/v1/health/live` | API route contract |
| API readiness | `http://localhost:8080/api/v1/health/ready` | API route contract |
| PostgreSQL | host port `55432` by default | `.env.example` / Compose default |
| Redis | host port `6379` by default | `.env.example` / Compose default |

Stop services without deleting PostgreSQL data with `npm run repo -- stop`. The
database-reset command is deliberately destructive and is documented separately.

## Contribution rule

A command, configuration value, migration procedure, or developer prerequisite
changed without its corresponding documentation is incomplete. Required gates
fail closed; do not bypass formatting, analyzers, architecture tests, repository
validation, integration tests, or CI.
