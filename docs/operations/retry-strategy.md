# Retry Strategy Guide

`RetryExecutor` is the sole infrastructure retry boundary for logical operations explicitly declared retryable. It creates a new dependency-injection scope and `PropriumDbContext` for every attempt, so state and tracking from a failed attempt cannot cross into the next one.

- Connection-transient failures retry the logical operation.
- PostgreSQL `40001` and `40P01` retry the complete transaction.
- Capacity and fatal failures do not retry.
- Indeterminate commits require an idempotency or verification strategy before any retry.

Security-version invalidation is deliberately non-retryable in Day 1. It uses a single PostgreSQL transaction plus atomic `UPDATE` statements to avoid lost updates and partial authorization changes. Retrying the operation after an indeterminate commit could increment a security version twice, so a future retry wrapper requires an idempotency key or authoritative completion check first.

Application code supplies typed retry and operation contexts; it never receives a service provider, scope, or generic resolver. Nested retries are prohibited.
