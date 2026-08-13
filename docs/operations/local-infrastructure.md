# Local Infrastructure Guide

The Day 4 development stack is intentionally isolated from the repository's legacy Compose file. It uses the `proprium` Compose project so its containers, network, and PostgreSQL volume cannot collide with another local stack.

## Start and stop

```powershell
docker compose -f docker-compose.proprium.yml up --build --detach --wait
docker compose -f docker-compose.proprium.yml ps
docker compose -f docker-compose.proprium.yml down
```

`down` stops and removes containers and the network, but retains the named PostgreSQL volume. Use `down --volumes` only when deliberately resetting local database data.

## Services and ordering

PostgreSQL and Redis must become healthy before the one-shot `database-migrations` service runs. The API starts only after that service completes successfully; the web service starts after API liveness is healthy. PostgreSQL data persists in `proprium_proprium-postgres`; Redis intentionally has no persistence in the development profile.

CI writes a PostgreSQL sentinel, restarts the PostgreSQL container, and verifies the sentinel and API readiness after recovery. Redis integration tests separately qualify write, read, expiration, removal, miss, unavailable, and serialization-failure behavior.

## Verification

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health/live
Invoke-RestMethod http://localhost:8080/api/v1/health/ready
Invoke-WebRequest -UseBasicParsing http://localhost:3000/health
```

Liveness reports process availability. Readiness checks PostgreSQL and Redis without exposing configuration or secrets. The migration history can be inspected with `docker compose -f docker-compose.proprium.yml exec postgres psql -U proprium -d proprium -c 'SELECT "MigrationId" FROM "__EFMigrationsHistory";'`.
