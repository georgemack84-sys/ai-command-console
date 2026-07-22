import { describe, expect, it } from "vitest";
import {
  getLearningAdaptationBundle,
  replayLearningAdaptation,
  runLearningAdaptation,
  validateLearningAdaptation,
} from "@/services/caf-learning-adaptation";
import type { LearningAdaptationScenario } from "@/types/caf-learning-adaptation";

describe("Program 3 P3.12 Learning and Adaptation", () => {
  it("publishes governed learning doctrine without owning runtime, replay infrastructure, or certification", () => {
    const bundle = getLearningAdaptationBundle();

    expect(bundle.doctrine.version).toBe("caf-learning-adaptation/v3.12");
    expect(bundle.doctrine.owns_governed_learning).toBe(true);
    expect(bundle.doctrine.owns_adaptation_proposals).toBe(true);
    expect(bundle.doctrine.owns_runtime_execution).toBe(false);
    expect(bundle.doctrine.owns_replay_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_certification).toBe(false);
    expect(bundle.doctrine.may_expand_authority).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic governed adaptation records", () => {
    const first = runLearningAdaptation();
    const second = runLearningAdaptation();

    expect(first.planning_reasoning_ref).toBe("caf-planning-reasoning/v3.5");
    expect(first.governance_authority_policy_ref).toBe("caf-governance-authority-policy/v3.7");
    expect(first.safety_behavioral_constraints_ref).toBe("caf-safety-behavioral-constraints/v3.8");
    expect(first.observability_telemetry_ref).toBe("caf-observability-telemetry/v3.10");
    expect(first.behavioral_replay_divergence_ref).toBe("caf-behavioral-replay-divergence/v3.11");
    expect(first.lifecycle.deterministic).toBe(true);
    expect(first.proposal.explainable).toBe(true);
    expect(first.assessment.qualification_result).toBe("QUALIFIED");
    expect(first.replay_validation.replay_validated).toBe(true);
    expect(first.replay_validation.duplicates_replay_infrastructure).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateLearningAdaptation(first).valid).toBe(true);
    expect(replayLearningAdaptation(first)).toBe(true);
  });

  it("enforces gates, evidence, bounded improvement, approval, and lineage", () => {
    const result = runLearningAdaptation();

    expect(result.governance_workflow.authority_gate_enforced).toBe(true);
    expect(result.governance_workflow.policy_gate_enforced).toBe(true);
    expect(result.governance_workflow.safety_gate_enforced).toBe(true);
    expect(result.governance_workflow.approval_integrated).toBe(true);
    expect(result.evidence_records).toHaveLength(7);
    expect(result.evidence_records.every((record) => record.immutable)).toBe(true);
    expect(result.bounded_improvement.authority_preserved).toBe(true);
    expect(result.bounded_improvement.constitutional_limits_preserved).toBe(true);
    expect(result.learning_record.lineage_refs.length).toBeGreaterThan(0);
    expect(result.certification.certified).toBe(true);
  });

  it.each([
    "P3_5_PLANNING_INVALID",
    "P3_7_GOVERNANCE_INVALID",
    "P3_8_SAFETY_INVALID",
    "P3_10_OBSERVABILITY_INVALID",
    "P3_11_REPLAY_INVALID",
    "CCI_REPLAY_NOT_CONSUMED",
    "CCI_REPLAY_DUPLICATED",
    "LEARNING_LIFECYCLE_NON_DETERMINISTIC",
    "ADAPTATION_PROPOSAL_MISSING",
    "ADAPTATION_QUALIFICATION_INVALID",
    "AUTHORITY_GATE_BYPASSED",
    "POLICY_GATE_BYPASSED",
    "SAFETY_GATE_BYPASSED",
    "REPLAY_VALIDATION_MISSING",
    "ADAPTATION_EVIDENCE_MISSING",
    "LEARNING_REGISTRY_INCOMPLETE",
    "BOUNDED_IMPROVEMENT_VIOLATED",
    "AUTHORITY_EXPANSION_ATTEMPTED",
    "CONSTITUTIONAL_GOVERNANCE_MODIFIED",
    "ADAPTATION_NOT_EXPLAINABLE",
    "ADAPTATION_LINEAGE_INCOMPLETE",
    "ADAPTATION_OBSERVABILITY_INCOMPLETE",
    "APPROVAL_INTEGRATION_MISSING",
    "REPLAY_DIVERGENCE",
  ] as const)("fails certification for %s", (scenario: LearningAdaptationScenario) => {
    const result = runLearningAdaptation({ scenario });
    const validation = validateLearningAdaptation(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runLearningAdaptation({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
