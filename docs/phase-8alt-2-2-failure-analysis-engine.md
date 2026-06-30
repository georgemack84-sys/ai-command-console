# Phase 8ALT.2.2 - Failure Analysis Engine

## Purpose

Phase 8ALT.2.2 implements the analytical core of Autonomous Recovery Intelligence. The engine deterministically identifies why autonomous execution failed, reconstructs causal lineage, analyzes dependency impact, calculates confidence, and produces governance-safe recovery candidates.

The engine is advisory-only. It does not execute recovery, restart workflows, perform rollback, mutate governance, change policy, alter history, bypass approval, suppress failures, fabricate evidence, hide state, or access cross-tenant data.

## Implementation

- `types/failure-analysis-engine.ts` defines failure categories, signals, root cause records, dependency graph records, lineage, confidence, candidates, replay, validation, and observability schemas.
- `services/failure-analysis-engine/index.ts` performs deterministic analysis, root cause reconstruction, dependency graph generation, lineage construction, confidence scoring, candidate generation, validation, replay, and observability.
- `app/api/failure-analysis-engine/*` exposes authenticated contract, analysis, validation, root cause, dependency, lineage, confidence, candidates, and replay routes.
- `tests/unit/failure-analysis-engine/failureAnalysisEngine.test.ts` verifies deterministic detection for all supported categories, replay reproducibility, confidence scoring, fail-closed behavior, advisory-only boundaries, and operator visibility.

## Supported Failure Categories

- Execution
- Planning
- Orchestration
- Dependency
- Supervision
- Integrity
- Checkpoint corruption
- Resource exhaustion
- Authority violation
- Governance violation

## Validation Guarantees

- Failure classification is deterministic.
- Root cause analysis is reproducible.
- Dependency graphs are complete and deterministic.
- Failure lineage is immutable and replay-compatible.
- Confidence scoring is evidence-based and reproducible.
- Recovery candidates are deterministic, explainable, governance-compliant, and advisory-only.
- Authority and governance violations are identified consistently.
- Replay reproduces identical analysis results.
- Tenant isolation is enforced.
- Autonomous recovery, governance mutation, evidence fabrication, and hidden state fail closed.

## Verification

Run:

```bash
npx vitest run tests/unit/failure-analysis-engine
npm run typecheck
```
