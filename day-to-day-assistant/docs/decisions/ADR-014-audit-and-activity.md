# ADR-014 - Audit and Activity

Status: Accepted
Date: 2026-07-18

## Context

The user must know what the assistant proposed and did.

## Decision

Record activity and audit events for proposals, confirmations, executions, failures, and uncertain outcomes.

## Alternatives Considered

Ephemeral logs were rejected.

## Consequences

Audit records are part of the product data model.

## Security Impact

Audit deletion is prohibited by default.

## Portability Impact

Audit data is included in backup and restore.

## Revisit Conditions

Revisit retention policy after MVP.
