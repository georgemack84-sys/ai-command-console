import { describe, expect, it } from "vitest";
import { getLifecycleEngineBundle, replayLifecycleEngine, runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import type { LifecycleEngineFailure } from "@/types/lifecycle-engine";

const CONDITIONAL_FAILURES: readonly LifecycleEngineFailure[] = [
  "LIFECYCLE_DOMAIN_MODEL_MISSING",
  "AGENT_STATE_MACHINE_MISSING",
  "RUNTIME_STATE_MACHINE_MISSING",
  "STATE_VERSIONING_MISSING",
  "IDEMPOTENCY_MISSING",
  "LIFECYCLE_COUPLING_MISSING",
  "TRANSITION_VALIDATION_MISSING",
  "HEALTH_SERVICE_MISSING",
  "STALE_HEALTH_NOT_DETECTED",
  "RECOVERY_MANAGER_MISSING",
  "RECOVERY_UNBOUNDED",
  "SUSPENSION_MANAGER_MISSING",
  "RETIREMENT_MANAGER_MISSING",
  "REVOCATION_ENFORCEMENT_MISSING",
  "LIFECYCLE_HISTORY_MISSING",
  "OBSERVABILITY_MISSING",
  "LIFECYCLE_EVIDENCE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly LifecycleEngineFailure[] = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "RUNTIME_NOT_AUTHORITATIVE",
  "EXECUTION_OUTSIDE_PERMITTED_STATE",
  "INVALID_TRANSITIONS_ALLOWED",
  "TERMINAL_STATE_EXIT_ALLOWED",
  "CONCURRENCY_CONTROL_FAILED",
  "SUSPENSION_PROPAGATION_FAILED",
  "REVOCATION_PROPAGATION_FAILED",
  "RETIREMENT_ACTIVE_RUNTIME_ALLOWED",
  "MISSING_PREREQUISITES_NOT_FAIL_CLOSED",
  "STALE_REQUEST_MUTATED_STATE",
  "HEALTH_AUTHORIZES_EXECUTION",
  "RECOVERY_BYPASSES_REVOCATION",
  "SUSPENSION_UNAUTHORIZED_CONTINUATION",
  "LIFECYCLE_HISTORY_NOT_IMMUTABLE",
  "LIFECYCLE_REPLAY_DIVERGENCE",
  "TENANT_ISOLATION_FAILED",
  "ORCHESTRATOR_INTEGRATION_INVALID",
  "REGISTRY_PROJECTION_AUTHORITATIVE",
];

describe("W2.2 Lifecycle Engine", () => {
  it("publishes lifecycle-engine doctrine and validates baseline", () => {
    const bundle = getLifecycleEngineBundle();

    expect(bundle.doctrine.version).toBe("lifecycle-engine/w2.2");
    expect(bundle.doctrine.owns_agent_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_runtime_instance_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_transition_validation).toBe(true);
    expect(bundle.doctrine.owns_lifecycle_coupling).toBe(true);
    expect(bundle.doctrine.owns_health_services).toBe(true);
    expect(bundle.doctrine.owns_lifecycle_history).toBe(true);
    expect(bundle.doctrine.owns_lifecycle_replay).toBe(true);
    expect(bundle.doctrine.qualification_gate).toBe("Lifecycle Infrastructure Qualification Gate");
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic lifecycle qualification with W2 references", () => {
    const first = runLifecycleEngine();
    const second = runLifecycleEngine();

    expect(first.phase_identifier).toBe("LifecycleEngine");
    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.agent_registry_ref).toBe("agent-registry/w2.1");
    expect(first.domain_model.agent_states).toHaveLength(10);
    expect(first.domain_model.runtime_states).toHaveLength(16);
    expect(first.evidence.records).toHaveLength(9);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateLifecycleEngine(first).valid).toBe(true);
    expect(replayLifecycleEngine(first)).toBe(true);
  });

  it("qualifies authoritative runtime lifecycle, agent lifecycle, coupling, and transition validation", () => {
    const result = runLifecycleEngine();

    expect(result.runtime_state_machine.authoritative_execution_control).toBe(true);
    expect(result.runtime_state_machine.execution_enabled_states).toEqual(["RUNNING"]);
    expect(result.runtime_state_machine.degraded_requires_signed_policy).toBe(true);
    expect(result.runtime_state_machine.terminal_state_enforcement).toBe(true);
    expect(result.runtime_state_machine.process_status_not_authoritative).toBe(true);
    expect(result.agent_lifecycle.new_runtime_eligibility_control).toBe(true);
    expect(result.agent_lifecycle.revocation_terminal).toBe(true);
    expect(result.coupling.suspension_propagation).toBe(true);
    expect(result.coupling.revocation_propagation).toBe(true);
    expect(result.coupling.retirement_zero_active_runtime_check).toBe(true);
    expect(result.transition_validation.optimistic_concurrency).toBe(true);
    expect(result.transition_validation.missing_prerequisites_fail_closed).toBe(true);
    expect(result.transition_validation.outcomes).toContain("FAIL_CLOSED");
  });

  it("qualifies health, recovery controls, history, APIs, observability, evidence, and gate readiness", () => {
    const result = runLifecycleEngine();

    expect(result.health_service.recommendations_only).toBe(true);
    expect(result.health_service.critical_health_fail_closed).toBe(true);
    expect(result.recovery_suspension_retirement_revocation.bounded_recovery).toBe(true);
    expect(result.recovery_suspension_retirement_revocation.revocation_overrides_recovery).toBe(true);
    expect(result.history_replay.append_only_history).toBe(true);
    expect(result.history_replay.state_reconstruction).toBe(true);
    expect(result.history_replay.divergence_detection).toBe(true);
    expect(result.apis_observability.registry_projection_non_authoritative).toBe(true);
    expect(result.apis_observability.orchestrator_verification).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.qualification.gate_decision).toBe("W2_2_LIFECYCLE_ENGINE_QUALIFIED");
    expect(result.readiness.decision).toBe("W2_2_LIFECYCLE_ENGINE_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks lifecycle engine conditionally qualified for remediable deficiency %s", (failure) => {
    const result = runLifecycleEngine({ scenario: failure });
    const validation = validateLifecycleEngine(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks lifecycle engine not qualified when the qualification gate fails", () => {
    const result = runLifecycleEngine({ scenario: "LIFECYCLE_QUALIFICATION_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateLifecycleEngine(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical lifecycle defect %s", (failure) => {
    const result = runLifecycleEngine({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateLifecycleEngine(result).valid).toBe(false);
  });

  it("keeps qualified-with-observations and conditional follow-up outside full qualification", () => {
    const observed = runLifecycleEngine({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const conditional = runLifecycleEngine({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.phase_ready).toBe(false);
    expect(validateLifecycleEngine(observed).valid).toBe(false);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
