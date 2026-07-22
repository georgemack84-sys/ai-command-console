# ADR-015 - Monorepo

Status: Accepted
Date: 2026-07-18

## Context

The project includes web, API, contracts, prompts, scripts, and docs.

## Decision

Use a monorepo.

## Alternatives Considered

Separate repositories were rejected as premature.

## Consequences

Changes can update contracts, code, tests, and docs together.

## Security Impact

Review can see cross-layer authority changes.

## Portability Impact

One clone contains the whole project.

## Revisit Conditions

Revisit only if independent release cycles become necessary.
