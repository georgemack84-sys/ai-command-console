# Mission Control Phase 9.3.2 - Mission & Tenant Context Resolver

## Preview

Phase 9.3.2 resolves authoritative mission and tenant context for every normalized decision candidate before downstream orchestration. It establishes mission scope, lifecycle, phase, health, priority, tenant ownership, tenant policy boundaries, and strict tenant isolation.

## Tightened Scope

- This phase resolves only mission and tenant context; authority, evidence, risk, confidence, governance, runtime, recovery, forecast, and historical resolvers remain downstream.
- Mission and tenant data are resolved from deterministic in-memory registries that model authoritative Mission Control services.
- Resolution is fail-closed for unknown mission, mission mismatch, missing lifecycle/health/priority, unknown tenant, policy gaps, ownership mismatch, boundary violation, cross-tenant references, or integrity failure.
- Mission context cache entries and tenant registry references are immutable, replay-safe, and hash-protected.
- Resolved mission and tenant domains can be injected back into the Phase 9.3.1 `DecisionContext` contract.

## Implementation

- `types/decision-mission-tenant-context.ts` defines mission context, tenant context, mission health, explainability, cache, registry, validation, replay, and observability contracts.
- `services/decision-mission-tenant-context/index.ts` implements deterministic mission and tenant registry resolution, isolation validation, domain projection, cache/registry evidence, replay, and metrics.
- `tests/unit/decision-mission-tenant-context/decisionMissionTenantContext.test.ts` verifies successful resolution, deterministic replay, context-domain integration, fail-closed mission/tenant/isolation failures, immutable cache/registry evidence, and observability.

## Public API

- `createMissionTenantContextRequest`
- `resolveMissionTenantContext`
- `replayMissionTenantContext`
- `buildMissionTenantObservability`
- `getMissionTenantContextResolver`
