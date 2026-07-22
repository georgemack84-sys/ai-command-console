# Workstream 2 Capability Registry

Phase W2.3 establishes the CAF Capability Registry as the authoritative source for capability definitions, composition, dependencies, risk, authority, tool bindings, validation, APIs, governance integration, and qualification evidence.

## Qualified Baseline

- Phase: `capability-registry/w2.3`
- Readiness identifier: `W2.3-CAPABILITY-REGISTRY-READINESS-001`
- Qualification gate: `Capability Registry Qualification Gate`
- Passing decision: `CAPABILITY_REGISTRY_QUALIFIED`
- Upstream anchors: W2.0 CAF Constitutional Foundation, W2.1 Agent Registry, W2.2 Lifecycle Engine

## Contract Surface

- `types/capability-registry.ts` defines immutable capability registry decisions, scenarios, failure modes, subsystem records, validation records, and bundle metadata.
- `services/capability-registry/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/capability-registry/*` exposes authenticated contract, validation, definition, composition, dependency, risk, authority, tool-binding, validation-engine, API-governance, evidence, qualification, and readiness slices.

## Governance Guarantees

- Capability identities are unique, immutable, schema validated, versioned, and linked to lifecycle, runtime, and evidence requirements.
- Composition rejects circular, duplicate, unsupported, authority-incompatible, and lifecycle-incompatible assemblies.
- Dependencies are deterministic, cycle-free, lineage-aware, and health validated.
- Risk and authority classifications are explicit and inherited through governed composition.
- Tool bindings require approval, tenant restrictions, version compatibility, trust requirements, and invocation policy controls.
- Validation rejects non-compliant capabilities before registry acceptance.
- API responses are deterministic and connected to governance events, policy, safety, planning, orchestration, and replay.
- Evidence is immutable, replayable, and bound to all registry subsystems.

## Verification

The W2.3 unit suite validates the qualified baseline, deterministic replay, subsystem coverage, conditional degradation, fail-closed behavior, explicit qualification gate failure, and observation/follow-up outcomes.
