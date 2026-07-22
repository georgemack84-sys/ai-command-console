# Mission Control Phase 9.3.4 - Evidence & Dependency Context Resolver

## Preview

Phase 9.3.4 resolves the evidentiary foundation and dependency graph for every decision candidate before orchestration. It ensures primary evidence, supporting evidence, conflicts, observations, findings, prerequisites, blockers, related recommendations, lineage, and replay artifacts are explicit and deterministic.

## Tightened Scope

- This phase resolves evidence and dependency context only; risk, confidence, governance, constitutional, runtime, recovery, and forecast context remain downstream.
- Evidence comes from deterministic certified registry records and preserves conflicting evidence instead of suppressing it.
- Dependencies are explicit, ordered, immutable, and acyclic; circular dependencies fail closed.
- Cross-tenant evidence, missing primary evidence, incomplete provenance, unresolved prerequisites/blockers, lineage gaps, and integrity failures fail closed.
- Resolved evidence and dependency domains can be injected into the Phase 9.3.1 `DecisionContext` contract.

## Implementation

- `types/decision-evidence-dependency-context.ts` defines evidence records, evidence context, dependency graph/context, lineage graph, validation, replay, and observability contracts.
- `services/decision-evidence-dependency-context/index.ts` implements deterministic evidence lookup, conflict preservation, observation/finding aggregation, dependency graph construction, validation, domain projection, replay, and metrics.
- `tests/unit/decision-evidence-dependency-context/decisionEvidenceDependencyContext.test.ts` verifies successful resolution, deterministic replay, conflict preservation, fail-closed evidence/dependency/isolation failures, context integration, lineage graph evidence, and observability.

## Public API

- `createEvidenceDependencyContextRequest`
- `resolveEvidenceDependencyContext`
- `replayEvidenceDependencyContext`
- `buildEvidenceDependencyObservability`
- `getEvidenceDependencyContextResolver`
