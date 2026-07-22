# Wave 6.5 Provider Consumption Framework

W6.5 establishes the canonical framework for how Wave 6 consumes provider capabilities from other Civitas programs and services. It standardizes provider discovery, consumed contract registration, immutable contract references, version governance, compatibility validation, consumption modes, failure semantics, replay requirements, dependency metadata, startup/deployment validation, and consumption governance.

Wave 6 consumes provider-owned contracts exactly as published. It does not define, duplicate, redefine, implement, execute, govern, publish, or manage provider-owned contracts or services.

## Runtime Contract

- `types/wave-six-provider-consumption-framework.ts` defines the doctrine, registries, compatibility matrix, policy and replay specs, validation governance, provider ownership boundary, readiness, and validation contracts.
- `services/wave-six-provider-consumption-framework/index.ts` consumes W6.1-W6.4 and canonical provider registries to produce deterministic provider consumption governance evidence.
- `app/api/wave-six-provider-consumption-framework/*` exposes authenticated contract, validation, provider discovery, consumer contract registry, version/compatibility, consumption policy/failure/replay, dependency validation governance, provider boundary, and readiness routes.

## Qualification Rules

- Every dependency declares a canonical provider.
- Every consumed capability references an immutable provider-owned contract.
- Every contract declares an approved version.
- Every dependency declares one canonical consumption mode unless explicitly governed.
- Failure semantics and replay requirements are explicit and deterministic.
- Compatibility validation must cover provider, contract, version, runtime, replay, and behavioral compatibility.
- Provider contracts may not be duplicated or redefined in Wave 6.
- Provider ownership boundaries remain intact.

## Exit Evidence

The unit suite verifies doctrine publication, deterministic replay, W6.1-W6.4 consumption, provider discovery, consumer contract registration, immutable contract references, version governance, compatibility validation, failure semantics, replay requirements, dependency validation, provider ownership boundaries, conditional degradation, and hard constitutional failures.
