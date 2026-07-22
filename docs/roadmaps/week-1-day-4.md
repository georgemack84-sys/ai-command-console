# Proprium Phase 1, Week 1, Day 4: Local Infrastructure

**Status:** Architecture locked  
**Prerequisites:** Days 1–3 and ADRs 004–009

## Objective

Qualify a deterministic local platform in which the frontend, platform API, PostgreSQL, and Redis run through Docker Compose. PostgreSQL is authoritative; Redis is non-authoritative and nonpersistent in the Day 4 development profile. No business-domain models are introduced beyond platform metadata.

## Workstreams

| Workstream | Outcome |
| --- | --- |
| PostgreSQL and EF Core | Persistent database, `PropriumDbContext`, `PlatformMetadata`, and initial migration |
| Migration ownership | One-shot `database-migrations` service applies migrations; API never calls `Database.Migrate()` |
| Redis and cache | Nonpersistent Redis plus typed cache results that distinguish miss, unavailable, serialization failure, and cancellation |
| Retry and lifetime | Central SQLSTATE classification, fresh scope/DbContext per attempt, typed dependency bundles |
| Compose | `web`, `platform-api`, `postgres`, `redis`, and `database-migrations` with ordered startup and health checks |
| Qualification | Unit, component, integration, behavioral, and architecture tests |

## Implementation sequence

1. Provision PostgreSQL, Redis, network, volumes, and Compose health checks.
2. Add EF Core persistence, platform metadata, and an initial migration.
3. Implement and wire the migration-runner service before API startup.
4. Add Redis cache contracts and expiration validation.
5. Add centralized retry classification/execution and typed attempt bundles.
6. Qualify behavior with real PostgreSQL and Redis tests, then finalize documentation.

## Non-negotiable constraints

- Compose owns orchestration; its liveness probe uses `/api/v1/health/live`.
- Readiness verifies PostgreSQL and Redis.
- The migration service owns migration execution; the API does not.
- Application code receives typed bundles, never `IServiceProvider`, `IServiceScope`, `IServiceScopeFactory`, or a generic resolver.
- Every retry attempt owns a fresh scope, DbContext, transaction, repositories, scoped services, and interceptors.
- Breaking persistence or contract changes require a new public version where applicable.

## Outputs

PostgreSQL and Redis services, EF Core persistence and migration, migration runner, cache and retry abstractions, typed dependency bundles, Compose integration, deterministic tests, and the Day 4 infrastructure documentation.

## Exit criteria

- All services start through Compose and the migration service gates API startup.
- PostgreSQL persistence and Redis cache behavior are validated, including restart persistence and cache expiry.
- Retry classification, boundaries, fresh-context behavior, and no-duplicate-side-effect behavior are proven.
- Architecture tests prohibit service-locator access and enforce typed dependency boundaries.
- ADRs 007–009 and the implementation specification are complete.

See the [implementation specification](../specifications/day-4-infrastructure-integration.md) for the detailed rules and [ADR-007](../architecture/ADR-0007-postgresql-persistence-and-retry.md), [ADR-008](../architecture/ADR-0008-redis-development-contract.md), and [ADR-009](../architecture/ADR-0009-migration-execution-model.md) for the frozen decisions.
