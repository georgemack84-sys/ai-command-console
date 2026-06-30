# Phase 8B.4 - Alternative Planning Engine

## Purpose

The Alternative Planning Engine generates deterministic, governance-compliant advisory strategies from a certified Phase 8B.3 optimized plan. It compares execution characteristics across standard alternatives while preserving constitutional compliance, governance enforcement, authority boundaries, tenant isolation, deterministic replay, operator visibility, and advisory-only behavior.

## Implemented Artifacts

- `types/alternative-planning.ts` defines intake, constraints, strategy variants, risk and reliability profiles, comparison matrices, tradeoff analysis, recommendation evidence, validation, replay, visibility, and aggregate framework contracts.
- `services/alternative-planning/index.ts` implements intake validation, strategy generation, plan variant building, tradeoff analysis, rationale generation, governance/replay validation, recommendation packaging, certification, replay, and visibility.
- `app/api/alternative-planning/*` exposes authenticated framework, intake, constraints, strategies, catalog, validate, replay, and visibility endpoints.
- `tests/unit/alternative-planning/alternativePlanning.test.ts` covers standard strategy generation, advisory-only guarantees, comparison and rationale completeness, certification scenarios, replay, visibility, and package integrity.

## Standard Alternatives

The package consistently produces `PREFERRED`, `CONSERVATIVE`, `LOW_RISK`, `HIGH_RELIABILITY`, and `OPERATOR_CONTROLLED` alternatives when the optimized plan is valid. Each alternative records its purpose, advantages, tradeoffs, risks, resource impact, operator guidance, evidence references, replay reference, lineage reference, confidence score, and integrity hash.

## Certification Rules

Certification returns `PASS`, `CONDITIONAL_PASS`, or `FAIL`. Hard failures include missing or duplicate strategies, unsupported strategies, governance violations, authority escalation, tenant isolation violations, replay divergence, hidden execution paths, and integrity mismatch. Conditional passes are allowed for documentation gaps that do not weaken governance or replay determinism.

## Advisory Boundary

The engine never selects or executes a plan. Packages always set `advisory_only` to `true` and `selected_plan_id` to `null`, leaving operator decision authority intact for Phase 8B.5 and downstream execution phases.
