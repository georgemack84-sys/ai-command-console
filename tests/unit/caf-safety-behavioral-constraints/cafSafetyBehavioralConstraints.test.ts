import { describe, expect, it } from "vitest";
import {
  getSafetyBehavioralConstraintBundle,
  replaySafetyBehavioralConstraints,
  runSafetyBehavioralConstraints,
  validateSafetyBehavioralConstraints,
} from "@/services/caf-safety-behavioral-constraints";
import type { SafetyBehavioralConstraintScenario } from "@/types/caf-safety-behavioral-constraints";

describe("Program 3 P3.8 Safety and Behavioral Constraints", () => {
  it("publishes safety doctrine without owning authority or policy definition", () => {
    const bundle = getSafetyBehavioralConstraintBundle();

    expect(bundle.doctrine.version).toBe("caf-safety-behavioral-constraints/v3.8");
    expect(bundle.doctrine.owns_safety_gate).toBe(true);
    expect(bundle.doctrine.owns_behavioral_constraints).toBe(true);
    expect(bundle.doctrine.owns_constitutional_authority).toBe(false);
    expect(bundle.doctrine.owns_policy_definition).toBe(false);
    expect(bundle.doctrine.fail_closed_required).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic safety decisions across runtime, memory, planning, collaboration, and governance", () => {
    const first = runSafetyBehavioralConstraints();
    const second = runSafetyBehavioralConstraints();

    expect(first.runtime_orchestration_ref).toBe("caf-runtime-orchestration/v3.3");
    expect(first.memory_knowledge_ref).toBe("caf-memory-knowledge/v3.4");
    expect(first.planning_reasoning_ref).toBe("caf-planning-reasoning/v3.5");
    expect(first.collaboration_federation_ref).toBe("caf-collaboration-federation/v3.6");
    expect(first.governance_authority_policy_ref).toBe("caf-governance-authority-policy/v3.7");
    expect(first.safety_gate.outcome).toBe("SAFE_WITH_WARNINGS");
    expect(first.safety_gate.deterministic).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSafetyBehavioralConstraints(first).valid).toBe(true);
    expect(replaySafetyBehavioralConstraints(first)).toBe(true);
  });

  it("emits constraints, warnings, interventions, containment, automation eligibility, exceptions, evidence, and observability", () => {
    const result = runSafetyBehavioralConstraints();

    expect(result.constraints).toHaveLength(3);
    expect(result.warnings).toHaveLength(3);
    expect(result.warnings.every((warning) => warning.routed && warning.replayable)).toBe(true);
    expect(result.automation_eligibility.decision).toBe("ELIGIBLE_WITH_APPROVAL");
    expect(result.intervention_decision.type).toBe("REQUIRE_APPROVAL");
    expect(result.containment_decision.level).toBe("LOCAL");
    expect(result.exception_governance.bypasses_constitutional_authority).toBe(false);
    expect(result.evidence_ledger.immutable).toBe(true);
    expect(result.observability.complete).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
  });

  it.each([
    "P3_3_RUNTIME_INVALID",
    "P3_4_MEMORY_GOVERNANCE_INVALID",
    "P3_5_PLANNING_INVALID",
    "P3_6_COLLABORATION_INVALID",
    "P3_7_GOVERNANCE_INVALID",
    "SAFETY_ARCHITECTURE_INCOMPLETE",
    "BEHAVIORAL_CONSTRAINT_MISSING",
    "SAFETY_GATE_NON_DETERMINISTIC",
    "ENFORCEMENT_NON_DETERMINISTIC",
    "INTERVENTION_NON_REPRODUCIBLE",
    "CONTAINMENT_NON_DETERMINISTIC",
    "SAFETY_WARNING_REGISTRY_INCOMPLETE",
    "WARNING_ROUTING_NON_DETERMINISTIC",
    "AUTOMATION_ELIGIBILITY_NON_DETERMINISTIC",
    "UNSAFE_AUTOMATION_ELIGIBLE",
    "EXCEPTION_BYPASSES_AUTHORITY",
    "EXCEPTION_EVIDENCE_MISSING",
    "EXCEPTION_EXPIRATION_MISSING",
    "SAFETY_EVIDENCE_MISSING",
    "OBSERVABILITY_INCOMPLETE",
    "REPLAY_DIVERGENCE",
    "FAIL_CLOSED_NOT_ENFORCED",
  ] as const)("fails certification for %s", (scenario: SafetyBehavioralConstraintScenario) => {
    const result = runSafetyBehavioralConstraints({ scenario });
    const validation = validateSafetyBehavioralConstraints(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runSafetyBehavioralConstraints({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
