# Migration Guide

## Authority

`PropriumDbContext` and its versioned EF Core migration files live in
`services/api/Proprium.Infrastructure/Persistence`. The one-shot Compose service
`database-migrations` is the only approved execution owner. It waits for healthy
PostgreSQL and Redis, runs `Proprium.Api.dll --migrate`, applies pending migrations
and seeds, then exits. Normal API startup never calls `Database.Migrate()`.

Apply migrations locally with the canonical command:

```bash
npm run repo -- migrate
```

```powershell
.\scripts\proprium.ps1 migrate
```

The command starts its own Compose dependencies; a separately running stack is not
required. Success is exit code `0`. A failure prevents API startup.

## Inspect status

After PostgreSQL is running, inspect the authoritative EF history without changing
it:

```bash
docker compose -f docker-compose.proprium.yml exec -T postgres psql -U proprium -d proprium -c 'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";'
```

Use `docker compose -f docker-compose.proprium.yml logs database-migrations` for
the migration runner's diagnostics.

## Creating a migration

The repository currently does not pin a `dotnet-ef` local tool, so migration
creation is a maintainer operation rather than a clean-onboarding prerequisite.
Before authorizing creation, add and review a repository-pinned tool manifest that
matches the centrally owned EF Core version in `Directory.Packages.props`. Do not
instruct developers to depend on an unversioned global tool.

When that prerequisite is established, the reviewed EF command must target:

- context: `PropriumDbContext`;
- migration project: `services/api/Proprium.Infrastructure`;
- startup project: `services/api/Proprium.Api`;
- output directory: the existing `Persistence` directory.

Review the generated migration, designer metadata when produced, and
`PropriumDbContextModelSnapshot` as production code. Use an intent-revealing name,
build and format the backend, exercise the migration on a fresh disposable
database, and verify repeated application is idempotent.

## Review and CI contract

The Integration and Health CI gates apply the same migration service against fresh
PostgreSQL state. Docker image builds also compile and test the backend. Reviewers
must confirm startup ordering, forward compatibility, seed idempotence, and the
absence of environment-specific data or secrets.

Never:

- create a second schema-management mechanism;
- call migration execution during ordinary API startup;
- edit an already-applied migration to repair a deployed schema;
- manually modify `__EFMigrationsHistory` as routine recovery; or
- treat a local reset as a production rollback strategy.

For incompatible disposable local state, follow [database-reset.md](database-reset.md).
Production rollback and database administration are outside GP-16.
