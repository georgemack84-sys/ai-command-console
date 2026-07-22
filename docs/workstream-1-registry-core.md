# W1.4A Registry Core

W1.4A deploys the canonical Registry Core as the authoritative source of truth for platform services, contracts, dependencies, ownership, and registry evidence. It consumes Identity Core, Storage Core, and Messaging Core capabilities and represents Security Core enforcement through registry authentication, authorization, access policy, cryptographic validation, and certificate validation controls.

## Constitutional Scope

- Owns registry engine, registry persistence, service registration, contract registration, dependency registration, ownership registry, deterministic query engine, registry messaging, registry security, and immutable registry evidence.
- Guarantees deterministic discovery and lookup by identity, namespace, service, contract, owner, dependency, and version.
- Publishes registration, update, ownership, dependency, and contract events over Messaging Core.
- Fails closed for predecessor invalidity, nondeterministic query behavior, authorization failure, access policy violation, mutable evidence, or replay invalidity.

## Implementation

- Contract: `types/registry-core.ts`
- Service: `services/registry-core/index.ts`
- API: `app/api/registry-core/*`
- Tests: `tests/unit/registry-core/registryCore.test.ts`

## Qualification

The qualification suite verifies deterministic activation, predecessor references, registry persistence, service/contract/dependency/ownership registration, deterministic query resolution, ownership and authority records, dependency graph controls, contract validation, registry event publication, security enforcement, immutable evidence, deterministic replay, conditional activation, not-active gate failure, and fail-closed critical defects.

The canonical successful readiness decision is `CORE_ACTIVATED`.
