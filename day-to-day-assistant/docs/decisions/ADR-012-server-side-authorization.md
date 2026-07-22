# ADR-012 - Server-Side Authorization

Status: Accepted
Date: 2026-07-18

## Context

Prompts cannot enforce security.

## Decision

Authority, security, validation, and confirmation rules are enforced by application code.

## Alternatives Considered

Prompt-only controls were rejected.

## Consequences

Every material action needs backend authorization tests.

## Security Impact

This is a core security control.

## Portability Impact

Rules travel with the repository.

## Revisit Conditions

Do not weaken this decision.
