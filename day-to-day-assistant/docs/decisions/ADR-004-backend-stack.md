# ADR-004 - Backend Stack

Status: Accepted
Date: 2026-07-18

## Context

The backend needs typed validation, local APIs, migrations, scheduled work, and testability.

## Decision

Use Python for the backend. Phase 0 uses a standard-library skeleton; Phase 1 should add FastAPI and Pydantic.

## Alternatives Considered

Node-only backend was rejected to keep Python AI and data tooling available.

## Consequences

Python services own domain logic and authority enforcement.

## Security Impact

Validation and confirmation enforcement must live in backend code.

## Portability Impact

Python is broadly available and container friendly.

## Revisit Conditions

Revisit if Python becomes a portability or packaging blocker.
