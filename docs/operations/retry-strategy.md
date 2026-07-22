# Retry Strategy Guide

`RetryExecutor` is the sole infrastructure retry boundary. It creates a new dependency-injection scope and `PropriumDbContext` for every attempt, so state and tracking from a failed attempt cannot cross into the next one.

- Connection-transient failures retry the logical operation.
- PostgreSQL `40001` and `40P01` retry the complete transaction.
- Capacity and fatal failures do not retry.
- Indeterminate commits require an idempotency or verification strategy before any retry.

Application code supplies typed retry and operation contexts; it never receives a service provider, scope, or generic resolver. Nested retries are prohibited.
