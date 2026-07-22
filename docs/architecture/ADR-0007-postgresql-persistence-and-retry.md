# ADR-0007: PostgreSQL persistence and retry strategy

**Status:** Accepted  
**Date:** 2026-07-22

## Decision

PostgreSQL is Proprium's canonical relational database. EF Core accesses it through `PropriumDbContext`. Redis is never authoritative for persisted state.

Persistence retries are centralized and classify failures as connection-transient, transaction-transient, fatal, capacity, or indeterminate. Connection failures retry the complete logical operation; transaction failures retry the complete transaction; capacity and fatal failures are not retried; indeterminate commit outcomes require verification or idempotency.

Every retry attempt creates a fresh DI scope, DbContext, transaction, repositories, scoped services, and interceptors. Application code receives typed dependency bundles rather than container interfaces or service locators.

## Consequences

The application pays an explicit composition cost for attempt bundles and detached projections, in exchange for no scoped state crossing an attempt boundary. Nested retries are prohibited.
