import { describe, expect, it } from "vitest";
import { getCafLegionRuntimeBundle, replayCafLegionRuntime, runCafLegionRuntime, validateCafLegionRuntime } from "@/services/caf-legion-runtime";
import type { CafLegionRuntimeFailure } from "@/types/caf-legion-runtime";

const CONDITIONAL_FAILURES: readonly CafLegionRuntimeFailure[] = [
  "RUNTIME_FOUNDATION_MISSING",
  "RUNTIME_LIFECYCLE_NON_DETERMINISTIC",
  "AGENT_REGISTRY_MISSING",
  "AGENT_DISCOVERY_FAILED",
  "ORCHESTRATOR_MISSING",
  "EXECUTION_ROUTING_FAILED",
  "WORKFLOW_COORDINATION_FAILED",
  "CAPABILITY_REGISTRY_MISSING",
  "CAPABILITY_VALIDATION_FAILED",
  "SKILL_REGISTRY_MISSING",
  "SKILL_COMPOSITION_FAILED",
  "PLANNING_ENGINE_MISSING",
  "PLANNING_NON_DETERMINISTIC",
  "PLAN_VALIDATION_FAILED",
  "MEMORY_ENGINE_MISSING",
  "MEMORY_GOVERNANCE_FAILED",
  "MEMORY_PERSISTENCE_FAILED",
  "COLLABORATION_ENGINE_MISSING",
  "COLLABORATION_GOVERNANCE_FAILED",
  "DELEGATION_ENGINE_MISSING",
  "POLICY_GATE_MISSING",
  "SAFETY_GATE_MISSING",
  "AUTHORITY_VALIDATOR_MISSING",
  "OPERATOR_CONSOLE_MISSING",
  "CAF_EVIDENCE_MISSING",
  "CAF_REPLAY_MISSING",
  "CERTIFICATION_PACKAGE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly CafLegionRuntimeFailure[] = [
  "W1_1B_IDENTITY_FULL_INVALID",
  "W1_2B_STORAGE_FULL_INVALID",
  "W1_3B_MESSAGING_FULL_INVALID",
  "W1_4B_REGISTRY_FULL_INVALID",
  "W1_5_CONFIGURATION_PLATFORM_INVALID",
  "W1_6_OBSERVABILITY_PLATFORM_INVALID",
  "W1_7B_SECURITY_FULL_INVALID",
  "RUNTIME_ISOLATION_FAILED",
  "AGENT_IDENTITY_BINDING_FAILED",
  "DELEGATION_AUTHORITY_FAILED",
  "POLICY_ENFORCEMENT_FAILED",
  "UNSAFE_ACTION_NOT_BLOCKED",
  "AUTHORITY_CHAIN_INVALID",
  "OPERATOR_SUPREMACY_FAILED",
  "CAF_EVIDENCE_NOT_IMMUTABLE",
  "CAF_REPLAY_NON_DETERMINISTIC",
];

describe("W1.8 CAF Legion Runtime", () => {
  it("publishes caf-legion-runtime doctrine and validates baseline", () => {
    const bundle = getCafLegionRuntimeBundle();

    expect(bundle.doctrine.version).toBe("caf-legion-runtime/w1.8");
    expect(bundle.doctrine.owns_agent_runtime).toBe(true);
    expect(bundle.doctrine.owns_agent_registry).toBe(true);
    expect(bundle.doctrine.owns_runtime_orchestrator).toBe(true);
    expect(bundle.doctrine.owns_capability_registry).toBe(true);
    expect(bundle.doctrine.owns_skill_registry).toBe(true);
    expect(bundle.doctrine.owns_planning_engine).toBe(true);
    expect(bundle.doctrine.owns_memory_engine).toBe(true);
    expect(bundle.doctrine.owns_governance_gates).toBe(true);
    expect(bundle.doctrine.qualification_gate).toBe("CAF Runtime Qualification Gate");
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic CAF runtime qualification with qualified W1 references", () => {
    const first = runCafLegionRuntime();
    const second = runCafLegionRuntime();

    expect(first.phase_identifier).toBe("CafLegionRuntime");
    expect(first.identity_full_ref).toBe("identity-full/w1.1b");
    expect(first.storage_full_ref).toBe("storage-full/w1.2b");
    expect(first.messaging_full_ref).toBe("messaging-full/w1.3b");
    expect(first.registry_full_ref).toBe("registry-full/w1.4b");
    expect(first.configuration_platform_ref).toBe("configuration-platform/w1.5");
    expect(first.observability_platform_ref).toBe("observability-platform/w1.6");
    expect(first.security_full_ref).toBe("security-full/w1.7b");
    expect(first.evidence.records).toHaveLength(7);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCafLegionRuntime(first).valid).toBe(true);
    expect(replayCafLegionRuntime(first)).toBe(true);
  });

  it("qualifies runtime foundation, agent registry, orchestrator, capability and skill registries", () => {
    const result = runCafLegionRuntime();

    expect(result.runtime_foundation.runtime_engine).toBe(true);
    expect(result.runtime_foundation.isolation_framework).toBe(true);
    expect(result.runtime_foundation.deterministic_lifecycle).toBe(true);
    expect(result.agent_registry.agent_registration).toBe(true);
    expect(result.agent_registry.identity_binding).toBe(true);
    expect(result.agent_registry.runtime_discovery).toBe(true);
    expect(result.orchestrator.agent_scheduling).toBe(true);
    expect(result.orchestrator.workflow_coordination).toBe(true);
    expect(result.orchestrator.execution_routing).toBe(true);
    expect(result.capability_skill_registries.capability_validation).toBe(true);
    expect(result.capability_skill_registries.skill_registration).toBe(true);
    expect(result.capability_skill_registries.skill_composition).toBe(true);
  });

  it("qualifies planning, memory, collaboration, delegation, governance, and operator controls", () => {
    const result = runCafLegionRuntime();

    expect(result.planning_memory.goal_planning).toBe(true);
    expect(result.planning_memory.deterministic_planning).toBe(true);
    expect(result.planning_memory.governed_memory).toBe(true);
    expect(result.planning_memory.memory_persistence).toBe(true);
    expect(result.collaboration_delegation.team_formation).toBe(true);
    expect(result.collaboration_delegation.authority_verification).toBe(true);
    expect(result.collaboration_delegation.delegation_audit).toBe(true);
    expect(result.governance.policy_enforcement).toBe(true);
    expect(result.governance.risk_blocking).toBe(true);
    expect(result.governance.authority_chain_validation).toBe(true);
    expect(result.operator_console.execution_monitoring).toBe(true);
    expect(result.operator_console.manual_approval).toBe(true);
    expect(result.operator_console.operator_supremacy).toBe(true);
  });

  it("qualifies CAF evidence, replay, certification, and readiness", () => {
    const result = runCafLegionRuntime();

    expect(result.evidence.execution_evidence).toBe(true);
    expect(result.evidence.policy_evidence).toBe(true);
    expect(result.evidence.authority_evidence).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.replay.runtime_replay).toBe(true);
    expect(result.replay.planning_replay).toBe(true);
    expect(result.replay.collaboration_replay).toBe(true);
    expect(result.replay.deterministic).toBe(true);
    expect(result.certification.certification_package).toBe(true);
    expect(result.certification.functional_qualification).toBe(true);
    expect(result.certification.governance_qualification).toBe(true);
    expect(result.certification.gate_decision).toBe("QUALIFIED");
    expect(result.readiness.decision).toBe("QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks CAF runtime conditionally qualified for remediable deficiency %s", (failure) => {
    const result = runCafLegionRuntime({ scenario: failure });
    const validation = validateCafLegionRuntime(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks CAF runtime not qualified when the qualification gate fails", () => {
    const result = runCafLegionRuntime({ scenario: "CAF_RUNTIME_QUALIFICATION_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateCafLegionRuntime(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical CAF runtime defect %s", (failure) => {
    const result = runCafLegionRuntime({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateCafLegionRuntime(result).valid).toBe(false);
  });

  it("keeps qualified-with-observations and conditional follow-up outside full qualification", () => {
    const observed = runCafLegionRuntime({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const conditional = runCafLegionRuntime({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.phase_ready).toBe(false);
    expect(validateCafLegionRuntime(observed).valid).toBe(false);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
