# ADR-002 - Modular Monolith

Status: Accepted
Date: 2026-07-18

## Context

The MVP needs clear modules without distributed systems overhead.

## Decision

Begin as a modular monolith.

## Alternatives Considered

Microservices and distributed queues were rejected for Phase 0.

## Consequences

Module boundaries are enforced through contracts, services, tests, and review.

## Security Impact

Authority checks can be centralized.

## Portability Impact

A monolith is easier to bootstrap on a new computer.

## Revisit Conditions

Revisit when measured scale or isolation needs exceed monolith capacity.
