# Retry Strategy Guide

`RetryExecutor` is the sole infrastructure retry boundary for logical operations explicitly declared retryable. It creates a new dependency-injection scope and resolves a typed `IRetryAttemptFactory<TDependencies>` for every attempt. The factory owns the attempt's DbContext, repositories, transaction, scoped services, and tracked-state detachment, so nothing scoped crosses into another attempt.

- Connection-transient failures retry the logical operation.
- PostgreSQL `40001` and `40P01` retry the complete transaction.
- Capacity and fatal failures do not retry.
- Indeterminate commits require an idempotency or verification strategy before any retry.

Commit exceptions are wrapped as `IndeterminateCommitException` and are never retried automatically. A retry operation cannot be nested inside another retry boundary. Consumers receive only their typed dependency bundle and attempt context; the service provider and scope factory remain inside `RetryExecutor`.

The qualification suite forces PostgreSQL serialization failures (`40001`) and deadlocks (`40P01`) against real transactions. It verifies fresh DbContext identities, complete-transaction retries, rollback and disposal, detached tracking, and final values that would expose stale state or duplicate commits.

Security-version invalidation is deliberately non-retryable in Day 1. It uses a single PostgreSQL transaction plus atomic `UPDATE` statements to avoid lost updates and partial authorization changes. Retrying the operation after an indeterminate commit could increment a security version twice, so a future retry wrapper requires an idempotency key or authoritative completion check first.

Application code supplies typed retry and operation contexts; it never receives a service provider, scope, or generic resolver. Architecture tests enforce that boundary and reject service-location inside the authentication handler.
