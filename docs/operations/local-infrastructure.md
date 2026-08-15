# Local Infrastructure Guide

`docker-compose.proprium.yml` owns the isolated Week 1 development stack. The
legacy root `docker-compose.yml` is not part of this workflow.

## Services, ports, and ownership

| Compose service | Role | Host binding | Container port | Persistence |
| --- | --- | --- | --- | --- |
| `postgres` | Authoritative application database | `POSTGRES_HOST_PORT`, default `55432` | `5432` | Named `proprium-postgres` volume |
| `redis` | Non-authoritative cache/rate-limit support | `REDIS_HOST_PORT`, default `6379` | `6379` | None |
| `database-migrations` | One-shot schema owner | None | None | Changes PostgreSQL schema/data |
| `platform-api` | ASP.NET Core API | `8080` | `8080` | None |
| `web` | Next.js frontend | `3000` | `3000` | None |

The root `.env.example` and Compose interpolation defaults own host ports and the
project name. Container-to-container traffic uses service names and container
ports, so changing a host port does not change API container configuration.

## Lifecycle

Preferred commands:

```bash
npm run repo -- migrate
npm run repo -- dev
npm run repo -- health
npm run repo -- stop
```

```powershell
.\scripts\proprium.ps1 migrate
.\scripts\proprium.ps1 dev
.\scripts\proprium.ps1 health
.\scripts\proprium.ps1 stop
```

`migrate` starts PostgreSQL and Redis, waits for their health checks, applies
migrations, and propagates the one-shot service's exit code. `dev` builds and
starts the complete stack with `--wait`; the API cannot start before migrations
succeed, and the web cannot start before API health succeeds. `stop` removes the
containers and network but retains PostgreSQL data.

Direct Compose commands are for diagnosis:

```bash
docker compose -f docker-compose.proprium.yml ps
docker compose -f docker-compose.proprium.yml logs platform-api
docker compose -f docker-compose.proprium.yml logs postgres redis database-migrations
```

Do not use `down --volumes` as routine shutdown. Follow the
[database-reset guide](database-reset.md) when local authoritative data must be
destroyed.

## Health and readiness

`npm run repo -- health` checks:

- `/api/v1/health/live`: the API process responds;
- `/api/v1/health/ready`: PostgreSQL and Redis respond; and
- `/health` on the frontend: the built web application responds.

The general `/api/v1/health` endpoint is informational. Liveness deliberately does
not depend on PostgreSQL or Redis. Readiness returns `503` when either dependency
is unavailable, so a live process can correctly remain unready.

Inspect dependency health directly when needed:

```bash
docker compose -f docker-compose.proprium.yml exec -T postgres pg_isready -U proprium -d proprium
docker compose -f docker-compose.proprium.yml exec -T redis redis-cli ping
```

## PostgreSQL and Redis boundaries

PostgreSQL is authoritative for identity, authorization, sessions, and application
state. The local account and database come from `.env.example`; example passwords
are development-only. Migrations are described in [migrations.md](migrations.md).

Redis is an unauthenticated, nonpersistent development cache. Clearing its local
state is safe only because the canonical data remains in PostgreSQL:

```bash
docker compose -f docker-compose.proprium.yml exec -T redis redis-cli FLUSHDB
```

This mutates local cache state and does not repair or reset authoritative data.

## Isolated qualification projects

When another stack already owns the default ports, use process environment values
and a unique project name rather than touching unrelated containers:

```powershell
$env:COMPOSE_PROJECT_NAME = 'proprium_onboarding_check'
$env:POSTGRES_HOST_PORT = '55433'
$env:REDIS_HOST_PORT = '56379'
.\scripts\proprium.ps1 dev
.\scripts\proprium.ps1 health
```

API and web host ports remain `8080` and `3000`; those must also be free for the
full stack. Remove only the named disposable project when qualification ends.
