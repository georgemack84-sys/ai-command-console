# Phase 2 — Semantic Scope and Applicability

- Status: Entry-ready after Phase 1 shakedown — implementation has not begun
- Depends on: [Canonical Learning Taxonomy — Implementation Specification](phase-1-canonical-learning-taxonomy-spec.md)

Phase 2 answers one question only:

> Where does this information apply?

It does not determine truth, durability, authority, authorization, or execution. A scope can narrow applicability but never grants permission.

## Part 1 status — scope vocabulary and compatibility

The canonical v1 scope dimensions are `SESSION`, `CONVERSATION`, `USER`, `PROJECT`, `WORKSPACE`, `AGENT`, `ORGANIZATION`, and `SYSTEM`. Identifiers are mandatory for every dimension except `SYSTEM`; an unqualified system scope remains subject to the existing authority and governance boundaries.

Processing states (`UNRESOLVED`, `RESOLVED`, `AMBIGUOUS`, `CONFLICTING`, and `REQUIRES_REVIEW`) are not scope dimensions. They describe the outcome of a later scope-resolution process.

Existing Phase 0 scopes map explicitly. `DOMAIN` becomes a separate applicability dimension requiring review, and `GLOBAL` does not silently become `SYSTEM`; it also requires review. This prevents scope widening during migration.

## Entry constraints

Phase 2 consumes the frozen Phase 1 category, provenance, confidence, and context outputs. It SHALL NOT redefine canonical categories or turn a resolved scope into durability, authority, validation, promotion, or execution permission.

`DOMAIN` remains a separate applicability dimension. `GLOBAL` remains review-only until a governed decision explicitly establishes a system boundary. Scope widening is always a proposal, never an inference.

## Planned sequence

1. Freeze scope vocabulary and migration mapping. **Complete.**
2. Define scope identity, parentage, and containment contracts.
3. Implement scope inheritance, narrowing, and widening proposals.
4. Add cross-project, agent, ownership, temporal, and conflict boundary tests.
5. Add governed scope-promotion evaluation and a Phase 2 exit gate.

The Phase 1 shakedown and handoff criteria are recorded in [Phase 1 Shakedown and Phase 2 Readiness](phase-1-shakedown-and-phase-2-readiness.md).
