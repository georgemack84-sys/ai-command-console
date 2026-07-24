# Day 4 Implementation Specification: Infrastructure Integration

## Scope

Implement local PostgreSQL, Redis, EF Core, migrations, cache contracts, retry execution, and Compose orchestration. This specification is authoritative for implementation; the [executive roadmap](../roadmaps/week-1-day-4.md) is the human-facing summary.

## Service topology

```text
postgres (healthy) ──> database-migrations (completed successfully) ──┐
redis (healthy) ──────────────────────────────────────────────────────┼─> platform-api ─> web
                                                                        └─> readiness dependencies
```

Compose services are `web`, `platform-api`, `postgres`, `redis`, and `database-migrations`. PostgreSQL uses a persistent named volume. Redis is nonpersistent and has no password in the canonical development profile. Compose owns local startup ordering and evaluates API liveness at `/api/v1/health/live`.

## Persistence and migration model

- PostgreSQL is the canonical relational store.
- `PropriumDbContext` owns `PlatformMetadata` mapping and the initial migration.
- `database-migrations` is a one-shot service: waits for PostgreSQL, applies migrations, and exits successfully.
- `platform-api` depends on successful completion of `database-migrations` and must not call `Database.Migrate()` during startup.
- Migrations are explicit, versioned artifacts and are executed with deployment identity and logs sufficient to diagnose a failed run.

## Health model

- Liveness: `/api/v1/health/live`; confirms process availability only.
- Readiness: `/api/v1/health/ready`; validates PostgreSQL and Redis.
- Health responses must preserve correlation identifiers and never disclose connection strings, credentials, or configuration dumps.

## Cache contract

The cache abstraction is typed and returns `CacheReadResult<T>`, `CacheWriteResult`, and `CacheRemoveResult` with `CacheOperationStatus`.

- A miss is distinct from unavailable infrastructure.
- Serialization failure is distinct from a miss.
- Cancellation is distinct from unavailable infrastructure.
- A successful read always contains a valid value.
- A failed read contains `default(T)` and a non-success status.
- Validation writes an expiring key, reads it, and verifies expiration.

## Retry model

Classify every persistence failure into exactly one of: connection-transient, transaction-transient, fatal, capacity, or indeterminate.

| Classification | Behavior |
| --- | --- |
| Connection-transient | Retry the complete logical operation |
| Transaction-transient (`40001`, `40P01`) | Retry the complete transaction |
| Capacity | Do not retry |
| Fatal | Do not retry |
| Indeterminate commit | Require verification or idempotency |

Retry execution is centralized. Nested retries are prohibited. Attempt logs and diagnostics record classification, attempt number, correlation identifier, and terminal result.

## Lifetime and dependency boundary

The retry executor is the DI boundary. Each attempt creates a new scope and therefore a new DbContext, transaction, repository set, scoped services, and interceptors. Results crossing the attempt boundary are detached projections.

Application code receives typed dependency bundles plus operation and attempt contexts. It must never receive `IServiceProvider`, `IServiceScope`, `IServiceScopeFactory`, a service locator, `GetService()`, or `Resolve()`.

## Qualification requirements

Unit tests cover cache statuses, SQLSTATE classification, and reflection architecture rules. Component tests prove fresh scopes, DbContexts, bundles, and disposal per attempt. Integration tests use real PostgreSQL and Redis for migrations, health, persistence, cache expiry, and Compose startup. Behavioral tests induce `40001` and `40P01`, verify complete-boundary retries, no stale tracking, and no duplicate commits or side effects.

## Documentation outputs

Create a local infrastructure guide, migration guide, and retry strategy guide. Keep ADRs 007–009 synchronized with implementation; implementation may not reopen their decisions.
