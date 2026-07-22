# ADR-013 - Job Scheduler

Status: Accepted
Date: 2026-07-18

## Context

Reminders and routines need scheduled execution.

## Decision

Start with an in-process scheduler in the monolith, backed by persistent records.

## Alternatives Considered

Distributed queues were rejected for the MVP.

## Consequences

Scheduler failure handling must be explicit.

## Security Impact

Delegated routines must define authority ceilings and expiration.

## Portability Impact

In-process scheduling keeps local bootstrap simple.

## Revisit Conditions

Revisit when reliability needs exceed single-process scheduling.
