# ADR-016 - API Versioning

Status: Accepted
Date: 2026-07-18

## Context

API contracts need stability.

## Decision

Application APIs will be versioned under `/api/v1` when feature endpoints are added. `/health` remains unversioned for operations.

## Alternatives Considered

Unversioned feature APIs were rejected.

## Consequences

Breaking changes require explicit version handling.

## Security Impact

Authorization checks apply across all versions.

## Portability Impact

No negative impact.

## Revisit Conditions

Revisit when public or plugin APIs are introduced.
