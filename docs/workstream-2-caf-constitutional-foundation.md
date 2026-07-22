# W2.0 CAF Constitutional Foundation

W2.0 establishes the constitutional architecture for CAF Legion before additional Wave 2 runtime, orchestration, planning, memory, collaboration, or autonomous capabilities are built.

## Constitutional Scope

- Owns the CAF Constitution, Agent Doctrine, Authority Model, Runtime Invariant Registry, CAF Vocabulary, CAF-CCI contracts, CAF-CATA contracts, CATA Availability Contract, Tenant Integration Contract, CAF Architecture, and governance evidence.
- Consumes qualified Wave 1 Platform Operations and CAF Legion Runtime readiness.
- Establishes authority precedence: Constitution, Operator Authority, Governance Policy, Safety Policy, CAF Runtime, Agent Execution.
- Requires deterministic execution and replay, immutable evidence, authority/policy/safety validation before execution, tenant and namespace isolation, signed decisions, advisory outputs, and replay reproducibility.
- Fails closed for invalid Wave 1 readiness, invalid authority precedence, missing operator supremacy, missing deterministic replay or immutable evidence requirements, missing authority/policy/safety validation, tenant isolation failure, CCI/CATA incompatibility, undefined CATA fail-closed behavior, unclear tenant boundaries, or mutable governance evidence.

## Implementation

- Contract: `types/caf-constitutional-foundation.ts`
- Service: `services/caf-constitutional-foundation/index.ts`
- API: `app/api/caf-constitutional-foundation/*`
- Tests: `tests/unit/caf-constitutional-foundation/cafConstitutionalFoundation.test.ts`

## Qualification

The qualification suite verifies constitutional completeness, agent doctrine, authority precedence, runtime invariants, canonical vocabulary, CCI and CATA contracts, CATA availability modes, tenant integration, architecture boundaries, immutable governance evidence, conditional approval, review failure, and fail-closed critical defects.

The canonical successful readiness decision is `CONSTITUTION_APPROVED`.
