# Workstream 2 Safety Gate

Phase W2.7 establishes the CAF Safety Gate as the final constitutional enforcement checkpoint before runtime execution. It consumes validated Authority and Policy outputs, evaluates runtime safety, monitors execution, provides emergency intervention, and records immutable safety evidence.

## Verified Baseline

- Phase: `safety-gate/w2.7`
- Readiness identifier: `W2.7-SAFETY-GATE-READINESS-001`
- Verification gate: `Safety Gate Verification Gate`
- Passing decision: `SAFETY_GATE_VERIFIED`
- Enforcement sequence: `Authority -> Policy -> Safety -> Operator`
- Upstream anchors: W2.0 CAF Constitutional Foundation, W2.1 Agent Registry, W2.2 Lifecycle Engine, W2.3 Capability Registry, W2.4 Skill Registry, W2.5 Authority Validator, W2.6 Policy Gate

## Contract Surface

- `types/safety-gate.ts` defines safety gate decisions, dispositions, failure modes, subsystem records, readiness, validation, and bundle metadata.
- `services/safety-gate/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/safety-gate/*` exposes authenticated contract, validation, rules, runtime, emergency-stop, monitoring, disposition mapping, registry, APIs, evidence, and readiness slices.

## Governance Guarantees

- No execution may bypass Authority Validation, Policy Resolution, and Safety Evaluation.
- Safety rules are immutable, versioned, governed, and traceable.
- Runtime safety is deterministic, continuous, fail-safe, and bypass resistant.
- Emergency stop can halt execution, terminate workflows, suspend agents, isolate runtimes, disable capabilities, and operate tenant-wide or globally.
- Monitoring detects unsafe behavior, repeated violations, anomalies, degradation, dangerous workflows, runaway execution, policy bypass attempts, and authority violations.
- Dispositions are standardized as `ALLOW`, `ALLOW_WITH_WARNING`, `REQUIRE_OPERATOR_APPROVAL`, `BLOCK`, and `EMERGENCY_STOP`.
- Evidence captures evaluated rules, outcomes, triggers, execution context, runtime state, operator interactions, emergency actions, timestamps, signatures, immutability, and replayability.

## Verification

The W2.7 unit suite validates verification status, deterministic replay, upstream anchoring, rules, runtime safety, emergency stop, monitoring, dispositions, registry, APIs, evidence, conditional degradation, fail-closed behavior, explicit verification failure, and observation/follow-up outcomes.
