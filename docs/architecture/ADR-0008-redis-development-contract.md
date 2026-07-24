# ADR-0008: Redis development contract

**Status:** Accepted  
**Date:** 2026-07-22

## Decision

Redis is a non-authoritative cache in the canonical development profile. It is nonpersistent and has no password. Cache contracts are typed and distinguish a miss from unavailable infrastructure, serialization failure, and cancellation.

Successful cache reads contain a valid value. Failed reads contain `default(T)` with a non-success status. Readiness validates Redis; liveness does not depend on it.

## Consequences

Redis loss cannot cause authoritative data loss. Callers must handle non-success cache results explicitly and must not collapse unavailable cache infrastructure into a cache miss.
