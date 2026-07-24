# ADR-0009: Dedicated migration execution model

**Status:** Accepted  
**Date:** 2026-07-22

## Decision

Database migrations execute only through the one-shot Docker Compose service `database-migrations`. It waits for healthy PostgreSQL, applies versioned EF Core migrations, and exits successfully. The API depends on that successful completion and never calls `Database.Migrate()` at startup.

## Consequences

Migration ownership, failure reporting, and startup ordering are explicit. API startup is deterministic and does not race schema creation. A failed migration blocks API startup until the deployment issue is corrected.
