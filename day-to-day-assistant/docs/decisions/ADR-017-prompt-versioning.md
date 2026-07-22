# ADR-017 - Prompt Versioning

Status: Accepted
Date: 2026-07-18

## Context

AI behavior must be inspectable and testable.

## Decision

Prompts will be versioned artifacts with changelog entries and tests.

## Alternatives Considered

Inline untracked prompts were rejected.

## Consequences

Assistant behavior changes require documentation and fixtures.

## Security Impact

Prompt-injection analysis can reference exact prompt versions.

## Portability Impact

Prompt behavior travels with the repository.

## Revisit Conditions

Revisit storage format if prompt volume grows.
