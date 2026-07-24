# Migration Guide

Create versioned EF Core migrations with the backend tooling and review the migration and model snapshot as production code. `PropriumDbContext` migrations live in `services/api/Proprium.Infrastructure/Persistence`.

The canonical local runner is the one-shot `database-migrations` service in `docker-compose.proprium.yml`; it waits for healthy PostgreSQL and Redis, applies migrations, and exits. The API starts only after a successful runner exit and must never call `Database.Migrate()` during normal startup.

```powershell
docker compose -f docker-compose.proprium.yml up database-migrations --build
docker compose -f docker-compose.proprium.yml logs database-migrations
```

A failed migration is a deployment gate. Investigate and add a forward migration; do not alter an already-applied migration or manually edit the migration-history table.
