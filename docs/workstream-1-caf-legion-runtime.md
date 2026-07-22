# W1.8 CAF Legion Runtime

W1.8 deploys the foundational CAF Legion Runtime above qualified Civitas Core Infrastructure. It provides the governed execution environment for agents, including runtime lifecycle, orchestration, planning, memory, collaboration, delegation, governance enforcement, safety validation, operator oversight, evidence, replay, and certification readiness.

## Constitutional Scope

- Owns agent runtime, agent registry, runtime orchestrator, capability registry, skill registry, planning engine, memory engine, collaboration, delegation, policy gate, safety gate, authority validator, operator console, CAF evidence, CAF replay, and CAF certification.
- Consumes qualified Identity Full, Storage Full, Messaging Full, Registry Full, Configuration Platform, Observability Platform, and Security Full.
- Fails closed for invalid qualified infrastructure, runtime isolation failure, agent identity binding failure, delegation authority failure, policy enforcement failure, unsafe action not blocked, invalid authority chain, operator supremacy failure, mutable evidence, or nondeterministic replay.

## Implementation

- Contract: `types/caf-legion-runtime.ts`
- Service: `services/caf-legion-runtime/index.ts`
- API: `app/api/caf-legion-runtime/*`
- Tests: `tests/unit/caf-legion-runtime/cafLegionRuntime.test.ts`

## Qualification

The qualification suite verifies runtime lifecycle, agent registry, orchestration, capability and skill registries, deterministic planning, governed memory, collaboration, delegation, policy and safety enforcement, authority validation, operator controls, immutable evidence, deterministic replay, certification artifacts, conditional qualification, gate failure, and fail-closed critical defects.

The canonical successful readiness decision is `QUALIFIED`.
