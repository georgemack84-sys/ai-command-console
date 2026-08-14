# Local Database Reset

> **This operation destroys local development data.**

The reset command removes the volumes owned by the selected local Proprium Compose
project, including its PostgreSQL database, then rebuilds the development stack and
reapplies all migrations. Redis is nonpersistent and is recreated with the stack.

## Safety boundary

Use this procedure only with `docker-compose.proprium.yml` and a local development
Docker context. It cannot target a remote PostgreSQL connection string; it removes
Docker volumes by Compose project name. Before continuing:

```bash
docker context show
docker compose -f docker-compose.proprium.yml config --quiet
docker compose -f docker-compose.proprium.yml ps
```

Confirm the Docker context, `COMPOSE_PROJECT_NAME`, and listed containers belong to
your disposable local Proprium stack. Stop if any target is ambiguous.

## Reset

Unix-like shell:

```bash
npm run repo -- reset-db --force
```

PowerShell 7:

```powershell
.\scripts\proprium.ps1 reset-db -Force
```

Without `--force` or `-Force`, the command fails closed before invoking Docker.
The operation is state-mutating and irreversible unless the local data was backed
up separately.

## Verify

The reset command starts the rebuilt stack. Verify migrations and health:

```bash
npm run repo -- health
docker compose -f docker-compose.proprium.yml exec -T postgres psql -U proprium -d proprium -c 'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";'
```

Then stop while retaining the newly created database:

```bash
npm run repo -- stop
```

Reset is not migration rollback. It is only a deterministic recovery mechanism for
disposable local state. Production recovery, backups, rollback, and shared database
administration are outside this guide.
