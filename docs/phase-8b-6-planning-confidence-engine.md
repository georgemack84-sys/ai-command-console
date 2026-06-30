# Phase 8B.6 - Planning Confidence Engine

## Purpose

The Planning Confidence Engine produces deterministic, explainable, governance-aware confidence assessments for complete planning packages before execution orchestration. It evaluates the objective hierarchy, dependency graph, optimized plan, alternative package, and contingency package while remaining advisory only.

## Implemented Artifacts

- `types/planning-confidence.ts` defines confidence intake, factor scores, classifications, assessment packages, validation, replay, visibility, and aggregate framework contracts.
- `services/planning-confidence/index.ts` implements confidence intake, factor evaluation, objective/dependency/policy/authority/history/replay/resource/risk scoring, aggregation, validation, replay, and visibility.
- `app/api/planning-confidence/*` exposes authenticated framework, intake, factors, assessment, validate, replay, and visibility endpoints.
- `tests/unit/planning-confidence/planningConfidence.test.ts` covers baseline scoring, classification, governance caps, failure scenarios, advisory-only behavior, replay, visibility, and integrity.

## Confidence Factors

The engine evaluates objective clarity, dependency completeness, policy certainty, authority certainty, historical success, replay consistency, resource availability, and risk level. Identical inputs produce identical factor ordering, scores, evidence, replay references, and integrity hashes.

## Governance Supremacy

Governance and replay failures cap or reject confidence regardless of efficiency. The engine never authorizes execution: assessments always set `advisory_only` to `true` and `execution_authorized` to `false`.
