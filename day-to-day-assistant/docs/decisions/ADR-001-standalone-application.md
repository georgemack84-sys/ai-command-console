# ADR-001 - Standalone Application

Status: Accepted
Date: 2026-07-18

## Context

The assistant must remain independent of any existing private ecosystem.

## Decision

Day-to-Day Assistant is an independent application with its own source, data, configuration, audit records, prompts, and backups.

## Alternatives Considered

Integrating into an existing platform was rejected because it would weaken portability and boundary clarity.

## Consequences

The project owns its foundations and must implement local capabilities directly.

## Security Impact

Security controls are enforced inside this application.

## Portability Impact

The repository can be cloned and run without private services.

## Revisit Conditions

Revisit only if a future adapter remains optional and removable.
