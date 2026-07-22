# Production Docker

The local production profile uses the existing `docker-compose.yml` as the development baseline. A hardened production image should run migrations, fail closed on health check failure, and mount `data/backups` on durable storage.
