# Mission Control Phase 9.3.3 - Authority & Operator Context Resolver

## Preview

Phase 9.3.3 resolves the authority model around every decision candidate before orchestration. It determines operator identity, approval authority, delegation lineage, escalation path, required approvals, governance and constitutional constraints, tenant isolation, and advisory-only status.

## Tightened Scope

- This phase resolves authority and operator context only; evidence, dependency, risk, confidence, runtime, recovery, and forecast context remain downstream.
- Resolution uses deterministic authority/operator registry records and never infers delegation or authority.
- Insufficient authority may produce a deterministic escalation path; invalid identity, invalid delegation, cross-tenant authority, missing governance/constitutional authority, or advisory-only violations fail closed.
- The resolver projects its output back into the Phase 9.3.1 `operator_context` domain.
- Authority cache entries and replay packages are immutable and hash-protected.

## Implementation

- `types/decision-authority-operator-context.ts` defines operator context, approval authority, delegation, escalation, required approvals, authority context, cache, validation, replay, and observability contracts.
- `services/decision-authority-operator-context/index.ts` implements deterministic operator lookup, approval and escalation resolution, delegation validation, advisory-only enforcement, context-domain projection, replay, and metrics.
- `tests/unit/decision-authority-operator-context/decisionAuthorityOperatorContext.test.ts` verifies successful resolution, deterministic replay, delegation, escalation, fail-closed errors, context integration, cache evidence, and observability.

## Public API

- `createAuthorityOperatorContextRequest`
- `resolveAuthorityOperatorContext`
- `replayAuthorityOperatorContext`
- `buildAuthorityOperatorObservability`
- `getAuthorityOperatorContextResolver`
