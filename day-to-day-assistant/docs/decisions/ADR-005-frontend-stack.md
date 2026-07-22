# ADR-005 - Frontend Stack

Status: Accepted
Date: 2026-07-18

## Context

The UI needs accessible stateful workflows.

## Decision

Use a TypeScript web frontend. Phase 0 uses a static shell; Phase 1 should add React and strict TypeScript tooling.

## Alternatives Considered

Server-rendered-only UI was rejected because conversational workflows need rich client state.

## Consequences

Typed API clients and explicit UI states are required.

## Security Impact

The frontend may propose actions but never enforces authority.

## Portability Impact

The UI runs locally in a browser.

## Revisit Conditions

Revisit if React is not needed after MVP workflow design.
