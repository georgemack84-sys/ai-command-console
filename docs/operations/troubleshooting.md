# Troubleshooting

| Symptom | Check | Resolution |
| --- | --- | --- |
| API readiness returns 503 | `docker compose -f docker-compose.proprium.yml ps` and `logs platform-api` | Confirm PostgreSQL and Redis are healthy, then rerun `make dev`. |
| Migration service fails | `docker compose -f docker-compose.proprium.yml logs database-migrations` | Fix the forward migration or configuration; do not edit migration history manually. |
| Port 3000, 55432, 6379, or 8080 is occupied | `docker ps` and local process manager | Stop the conflicting local service or change the Compose port mapping deliberately. |
| Environment validation fails | `npm run validate:configuration` | Start from the relevant `.env.example`; remove secrets from browser-visible variables. |
| Local database needs a clean slate | `.\scripts\proprium.ps1 reset-db -Force` | This deletes only the named Proprium development PostgreSQL volume. |
| CI differs from local validation | `make lint`, `make test`, `make build` | Use repository commands; CI invokes the same validation categories with infrastructure isolated to its integration job. |
