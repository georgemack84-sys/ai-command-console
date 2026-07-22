# W2.1 Agent Registry

W2.1 establishes the constitutional registry and authoritative catalog for CAF Legion agents. It stores governed registration and lifecycle metadata only; it does not execute agents.

## Constitutional Scope

- Owns agent registry service, immutable agent identity model, versioning, lineage, deterministic discovery, ownership governance, configuration references, computed runtime eligibility, certification references, trust references, registry explorer, lineage view, qualification, and immutable evidence.
- Consumes W2.0 CAF Constitutional Foundation, Identity Full, Registry Full, Configuration Platform, and Security Full.
- Keeps configuration values, certification evidence, and CATA trust evaluations external by reference.
- Fails closed for invalid constitutional or infrastructure dependencies, nondeterministic registration/discovery, mutable identity/version/lineage artifacts, non-computed or non-reproducible eligibility, tenant isolation failure, constitutional compliance failure, mutable evidence, or invalid replay.

## Implementation

- Contract: `types/agent-registry.ts`
- Service: `services/agent-registry/index.ts`
- API: `app/api/agent-registry/*`
- Tests: `tests/unit/agent-registry/agentRegistry.test.ts`

## Qualification

The qualification suite verifies deterministic registration, identity uniqueness, immutable version lineage, deterministic discovery replay, ownership validation, configuration reference validation, reproducible eligibility, certification and trust reference resolution, explorer behavior, lineage visualization, evidence integrity, tenant isolation, constitutional governance, gate failure, and fail-closed critical defects.

The canonical successful readiness decision is `AGENT_REGISTRY_QUALIFIED`.
