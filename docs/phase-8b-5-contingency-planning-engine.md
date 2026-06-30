# Phase 8B.5 - Contingency Planning Engine

## Purpose

The Contingency Planning Engine prepares deterministic advisory recovery plans before execution begins. It analyzes the optimized plan and alternative planning package to generate rollback, retry, operator intervention, safe-stop, and degraded execution plans without initiating recovery autonomously.

## Implemented Artifacts

- `types/contingency-planning.ts` defines intake, failure scenarios, contingency plans, decision matrix rows, evidence packages, certification, validation, replay, visibility, and aggregate framework contracts.
- `services/contingency-planning/index.ts` implements contingency intake, failure scenario analysis, recovery plan generation, decision matrix construction, evidence packaging, certification, validation, replay, and visibility.
- `app/api/contingency-planning/*` exposes authenticated framework, intake, scenarios, plans, matrix, validate, replay, and visibility endpoints.
- `tests/unit/contingency-planning/contingencyPlanning.test.ts` covers baseline recovery planning, decision matrix mapping, advisory-only behavior, certification scenarios, replay, visibility, and package integrity.

## Recovery Coverage

The package generates recovery plans for rollback, retry, operator intervention, safe-stop, and degraded execution. It analyzes partial failures, dependency failures, governance failures, authority loss, environmental changes, and multiple failures.

## Certification Rules

Certification returns `PASS`, `CONDITIONAL_PASS`, or `FAIL`. Hard failures include uncertified upstream planning, missing governance, invalid replay references, inconsistent planning state, missing recovery strategies, impossible rollback, unsafe retry, safe-stop state loss, degraded governance violations, authority escalation, tenant isolation violations, replay divergence, broken lineage, hidden recovery logic, unrecoverable execution state, and integrity mismatch.

## Advisory Boundary

The engine never initiates recovery. Packages always set `advisory_only` to `true`, `recovery_initiated` to `false`, and `selected_recovery_plan_id` to `null`.
