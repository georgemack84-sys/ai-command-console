# ADR-006 - Database

Status: Accepted
Date: 2026-07-18

## Context

The foundation needs local persistence and migration support.

## Decision

Use SQLite for Phase 0 portability, with migration scripts from the start.

## Alternatives Considered

PostgreSQL was deferred until the data model requires it.

## Consequences

Backups are simple and local. Future migration to PostgreSQL remains possible.

## Security Impact

Local database files must be protected by file permissions and future encryption policy.

## Portability Impact

SQLite improves clean-computer bootstrap.

## Revisit Conditions

Revisit when concurrent access, extensions, or operational needs require PostgreSQL.
