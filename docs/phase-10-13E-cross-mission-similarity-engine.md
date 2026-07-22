# Phase 10.13E - Cross-Mission Similarity Engine

## Purpose

Build the deterministic, governance-aware historical similarity layer for Adaptive Memory.

The engine answers which previous missions are most relevant to a current mission and why. It provides advisory historical context only; it never creates autonomous learning, makes decisions, modifies recommendations, or expands system authority.

## Tightened Contract

- Engine version: `cross-mission-similarity-engine/v1`
- Engine identifier: `CrossMissionSimilarityEngine`
- Required predecessor: Phase 10.13D Pattern Memory Registry
- Comparison dimensions: objective, evidence, risk, confidence, governance, outcome, simulation, strategy, operator, and certification
- Cross-tenant behavior: blocked by default unless explicitly governed, anonymized, certified, constitutionally approved, and fully audited

## Engine Components

The implementation defines candidate eligibility, mission comparison records, context dimensions, deterministic component scoring, ranked similarity records, explanation payloads, similarity ledger, and observability metrics.

## Invariants

Every comparison is deterministic, replayable, governed before execution, tenant-isolated, explainable, and advisory-only. Ranking cannot change without evidence, and every result preserves evidence, governance, replay, and supporting pattern references.

## Failure Behavior

Similarity analysis is rejected when the registry is unavailable, scores or comparison results become nondeterministic, unauthorized missions become comparable, tenant isolation is violated, governance validation is bypassed, replay references are missing, evidence lineage is incomplete, ranking drifts without evidence, explanations are inconsistent, integrity verification fails, unauthorized knowledge sharing occurs, or cross-tenant comparison lacks explicit approval.

## Implementation

- Types: `types/cross-mission-similarity-engine.ts`
- Service: `services/cross-mission-similarity-engine/index.ts`
- API routes: `app/api/cross-mission-similarity-engine/*`
- Tests: `tests/unit/cross-mission-similarity-engine/crossMissionSimilarityEngine.test.ts`

The exported service exposes `establishCrossMissionSimilarityEngine`, `replayCrossMissionSimilarityEngine`, and `getCrossMissionSimilarityEngine`.
