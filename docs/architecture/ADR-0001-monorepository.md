# ADR-0001: Use a monorepository structure

**Status:** Accepted  
**Date:** 2026-07-22

## Context

The project needs a single authoritative location for frontend, backend, shared contracts, infrastructure, and governance. The repository must be practical for a solo maintainer while allowing future ownership boundaries.

## Decision

Use a monorepository organized around `apps/`, `services/`, `packages/`, `infrastructure/`, `docs/`, `scripts/`, and `tests/`. Projects are introduced as implementation work begins; empty directories preserve the intended boundary without pretending a project has been bootstrapped.

## Consequences

Shared contracts and tooling are visible and versioned with their consumers. Boundary discipline and architecture tests become important as the repository grows. This decision does not prescribe a runtime, deployment platform, or application framework.
