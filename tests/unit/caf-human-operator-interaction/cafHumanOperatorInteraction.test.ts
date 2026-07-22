import { describe, expect, it } from "vitest";
import {
  getHumanOperatorInteractionBundle,
  replayHumanOperatorInteraction,
  runHumanOperatorInteraction,
  validateHumanOperatorInteraction,
} from "@/services/caf-human-operator-interaction";
import type { HumanOperatorInteractionScenario } from "@/types/caf-human-operator-interaction";

const canonicalSequence = [
  "Resolve Authority Matrix approval requirement",
  "P3.9 Operator approval when required",
  "P3.7 Authority Gate",
  "P3.7 Policy Gate",
  "P3.8 Safety Gate",
  "Warning disposition",
  "Execution admission",
  "Authorized execution",
];

describe("Program 3 P3.9 Human and Operator Interaction", () => {
  it("publishes exclusive operator interaction doctrine", () => {
    const bundle = getHumanOperatorInteractionBundle();

    expect(bundle.doctrine.version).toBe("caf-human-operator-interaction/v3.9");
    expect(bundle.doctrine.exclusive_operator_interaction_layer).toBe(true);
    expect(bundle.doctrine.owns_operator_approval).toBe(true);
    expect(bundle.doctrine.owns_warning_acknowledgement).toBe(true);
    expect(bundle.doctrine.owns_constitutional_authority).toBe(false);
    expect(bundle.doctrine.owns_policy_contracts).toBe(false);
    expect(bundle.doctrine.owns_safety_contracts).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("captures deterministic approvals, warning dispositions, and execution authorization", () => {
    const first = runHumanOperatorInteraction();
    const second = runHumanOperatorInteraction();

    expect(first.constitutional_ref).toBe("P3.0-CAF-CONSTITUTION-001");
    expect(first.governance_authority_policy_ref).toBe("caf-governance-authority-policy/v3.7");
    expect(first.safety_behavioral_constraints_ref).toBe("caf-safety-behavioral-constraints/v3.8");
    expect(first.operator_approval.approval_decision).toBe("APPROVE");
    expect(first.operator_approval.authority_verified).toBe(true);
    expect(first.warning_dispositions.every((disposition) => disposition.replayable)).toBe(true);
    expect(first.execution_authorization.admission_state).toBe("AUTHORIZED");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateHumanOperatorInteraction(first).valid).toBe(true);
    expect(replayHumanOperatorInteraction(first)).toBe(true);
  });

  it("enforces the canonical runtime execution sequence", () => {
    const result = runHumanOperatorInteraction();

    expect(result.runtime_execution_sequence.steps).toEqual(canonicalSequence);
    expect(result.runtime_execution_sequence.canonical_order_enforced).toBe(true);
    expect(result.runtime_execution_sequence.bypass_detected).toBe(false);
    expect(result.runtime_execution_sequence.parallelization_detected).toBe(false);
    expect(result.runtime_execution_sequence.admission_after_disposition).toBe(true);
    expect(result.certification.canonical_sequence_enforced).toBe(true);
  });

  it.each([
    "P3_0_AUTHORITY_MATRIX_INVALID",
    "P3_7_GOVERNANCE_INVALID",
    "P3_8_SAFETY_INVALID",
    "INTERACTION_FRAMEWORK_DUPLICATED",
    "APPROVAL_REQUIREMENT_NOT_RESOLVED",
    "OPERATOR_APPROVAL_MISSING",
    "OPERATOR_AUTHORITY_INVALID",
    "APPROVAL_NON_DETERMINISTIC",
    "WARNING_ACKNOWLEDGEMENT_MISSING",
    "WARNING_DISPOSITION_NOT_REPLAYABLE",
    "ESCALATION_ROUTING_INVALID",
    "INTERVENTION_GOVERNANCE_INVALID",
    "DECISION_PRESENTATION_INCOMPLETE",
    "EXECUTION_SEQUENCE_REORDERED",
    "EXECUTION_SEQUENCE_BYPASSED",
    "ADMISSION_BEFORE_DISPOSITION",
    "APPROVAL_EVIDENCE_MISSING",
    "INTERACTION_REPLAY_DIVERGENCE",
    "OBSERVABILITY_INCOMPLETE",
    "FAIL_CLOSED_NOT_ENFORCED",
  ] as const)("fails certification for %s", (scenario: HumanOperatorInteractionScenario) => {
    const result = runHumanOperatorInteraction({ scenario });
    const validation = validateHumanOperatorInteraction(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runHumanOperatorInteraction({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
