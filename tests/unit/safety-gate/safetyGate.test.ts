import { describe, expect, it } from "vitest";

import {
  getSafetyGateBundle,
  replaySafetyGate,
  runSafetyGate,
  validateSafetyGate,
} from "@/services/safety-gate";
import type { SafetyGateFailure } from "@/types/safety-gate";

const conditionalFailures = [
  "SAFETY_RULE_ENGINE_MISSING",
  "RUNTIME_SAFETY_ENGINE_MISSING",
  "EMERGENCY_STOP_CONTROLLER_MISSING",
  "SAFETY_MONITORING_MISSING",
  "DISPOSITION_MAPPING_MISSING",
  "SAFETY_REGISTRY_MISSING",
  "SAFETY_API_MISSING",
  "SAFETY_EVIDENCE_MISSING",
] as const satisfies readonly SafetyGateFailure[];

const failClosedFailures = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_2_LIFECYCLE_ENGINE_INVALID",
  "W2_3_CAPABILITY_REGISTRY_INVALID",
  "W2_4_SKILL_REGISTRY_INVALID",
  "W2_5_AUTHORITY_VALIDATOR_INVALID",
  "W2_6_POLICY_GATE_INVALID",
  "AUTHORITY_POLICY_INPUT_NOT_VALIDATED",
  "SAFETY_RULES_MUTABLE",
  "PROHIBITED_ACTION_ALLOWED",
  "TENANT_SAFETY_BOUNDARY_BYPASSED",
  "SAFETY_EVALUATION_NON_DETERMINISTIC",
  "EXECUTION_BYPASSED_SAFETY_GATE",
  "FAIL_SAFE_EXECUTION_DISABLED",
  "EMERGENCY_STOP_NOT_IMMEDIATE",
  "RUNTIME_ISOLATION_FAILED",
  "AGENT_SUSPENSION_FAILED",
  "UNSAFE_BEHAVIOR_UNDETECTED",
  "POLICY_BYPASS_UNDETECTED",
  "AUTHORITY_VIOLATION_UNDETECTED",
  "INVALID_SAFETY_DISPOSITION_ALLOWED",
  "OPERATOR_GUIDANCE_MISSING",
  "SAFETY_REGISTRY_INTEGRITY_FAILED",
  "SAFETY_EVIDENCE_NOT_IMMUTABLE",
  "SAFETY_REPLAY_INVALID",
] as const satisfies readonly SafetyGateFailure[];

describe("Safety Gate W2.7", () => {
  it("publishes the W2.7 safety doctrine and verification bundle", () => {
    const bundle = getSafetyGateBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "safety-gate/w2.7",
      owns_safety_rules: true,
      owns_runtime_safety: true,
      owns_emergency_stop: true,
      owns_safety_monitoring: true,
      owns_safety_dispositions: true,
      owns_safety_registry: true,
      owns_safety_evidence: true,
      fail_closed: true,
      enforcement_sequence: "Authority -> Policy -> Safety -> Operator",
      verification_gate: "Safety Gate Verification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("SAFETY_GATE_VERIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic safety evaluation to W2.0 through W2.6", () => {
    const first = runSafetyGate();
    const second = runSafetyGate();

    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.agent_registry_ref).toBe("agent-registry/w2.1");
    expect(first.lifecycle_engine_ref).toBe("lifecycle-engine/w2.2");
    expect(first.capability_registry_ref).toBe("capability-registry/w2.3");
    expect(first.skill_registry_ref).toBe("skill-registry/w2.4");
    expect(first.authority_validator_ref).toBe("authority-validator/w2.5");
    expect(first.policy_gate_ref).toBe("policy-gate/w2.6");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSafetyGate(first).valid).toBe(true);
    expect(replaySafetyGate(first)).toBe(true);
  });

  it("enforces constitutional, runtime, capability, skill, prohibited-action, and tenant rules", () => {
    const result = runSafetyGate();

    expect(result.rules).toMatchObject({
      constitutional_rules: true,
      runtime_rules: true,
      capability_constraints: true,
      skill_constraints: true,
      execution_restrictions: true,
      prohibited_action_rules: true,
      escalation_rules: true,
      tenant_boundaries: true,
      rule_library: true,
      rule_evaluation_service: true,
      immutable_rules: true,
    });
  });

  it("validates runtime safety, fail-safe behavior, and emergency stop controls", () => {
    const result = runSafetyGate();

    expect(result.runtime).toMatchObject({
      pre_execution_validation: true,
      runtime_verification: true,
      continuous_checking: true,
      action_approval: true,
      action_denial: true,
      warning_generation: true,
      deterministic_evaluation: true,
      fail_safe_execution: true,
      bypass_prevention: true,
    });
    expect(result.emergency_stop).toMatchObject({
      immediate_execution_stop: true,
      workflow_termination: true,
      agent_suspension: true,
      runtime_isolation: true,
      capability_disablement: true,
      tenant_emergency_stop: true,
      global_emergency_stop: true,
      deterministic_shutdown: true,
    });
  });

  it("monitors runtime behavior and maps canonical safety dispositions", () => {
    const result = runSafetyGate();

    expect(result.monitoring).toMatchObject({
      unsafe_behavior: true,
      repeated_violations: true,
      execution_anomalies: true,
      safety_degradation: true,
      dangerous_workflows: true,
      runaway_execution: true,
      policy_bypass_attempts: true,
      authority_violations: true,
      watchdog: true,
      alerts: true,
      continuous: true,
    });
    expect(result.disposition_mapping.dispositions).toEqual(["ALLOW", "ALLOW_WITH_WARNING", "REQUIRE_OPERATOR_APPROVAL", "BLOCK", "EMERGENCY_STOP"]);
    expect(result.disposition_mapping).toMatchObject({
      rationale: true,
      violated_rule: true,
      evidence_references: true,
      operator_guidance: true,
      remediation_recommendation: true,
      canonical_mapping: true,
    });
  });

  it("maintains safety registry, APIs, evidence, and execution bypass prevention", () => {
    const result = runSafetyGate();

    expect(result.registry).toMatchObject({
      safety_rules: true,
      rule_versions: true,
      safety_profiles: true,
      execution_constraints: true,
      monitoring_rules: true,
      emergency_procedures: true,
      disposition_mappings: true,
      safety_evidence_references: true,
      registry_integrity: true,
    });
    expect(result.apis).toMatchObject({
      safety_evaluation_api: true,
      rule_registry_api: true,
      emergency_stop_api: true,
      monitoring_api: true,
      disposition_api: true,
      evidence_api: true,
      replay_api: true,
      stable: true,
    });
    expect(result.evidence.records).toHaveLength(8);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.readiness.execution_bypass_prevented).toBe(true);
    expect(result.readiness.safety_precedes_operator_runtime).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional verification for %s", (failure) => {
    const result = runSafetyGate({ scenario: failure });
    const validation = validateSafetyGate(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_VERIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_VERIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runSafetyGate({ scenario: failure });
    const validation = validateSafetyGate(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit verification failure as not verified", () => {
    const result = runSafetyGate({ scenario: "SAFETY_GATE_VERIFICATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_VERIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateSafetyGate(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runSafetyGate({ scenario: "VERIFIED_WITH_OBSERVATIONS" });
    const followup = runSafetyGate({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_VERIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_VERIFIED");
    expect(followup.readiness.failures).toEqual([]);
  });
});
