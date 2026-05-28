import { describe, expect, it } from "vitest";

import { evaluateExecutionEligibility } from "@/services/validation/executionEligibilityGate";
import { createValidationSnapshot } from "@/services/validation/validationSnapshot";
import { validatePlanDraft } from "@/services/validation/planValidator";

function makeValidResult() {
  return validatePlanDraft({
    plan: {
      planId: "eligible_plan",
      intent: "inspect file",
      metadata: { actor: "user" },
      schemaVersion: "1",
      steps: [{ id: "s1", type: "tool", tool: "read_file", input: { path: "a.ts" }, safety: { riskLevel: "low", requiresApproval: false } }],
    },
    governance: {
      policiesAttached: true,
      constitutionalSafe: true,
      containmentActive: false,
      freezeActive: false,
      operatorSupremacyPreserved: true,
      governanceVersion: "g1",
    },
  });
}

describe("executionEligibilityGate", () => {
  it("blocks when the snapshot is missing", () => {
    const result = makeValidResult();
    const eligibility = evaluateExecutionEligibility({
      result,
      currentPlanHash: result.planHash,
      currentGovernanceDecisionHash: result.governanceDecisionHash,
    });

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.blocked).toBe(true);
    expect(eligibility.reasons).toContain("VALIDATION_SNAPSHOT_MISSING");
  });

  it("blocks approval-required plans without approval", () => {
    const result = validatePlanDraft({
      plan: {
        planId: "approval_plan",
        intent: "update file",
        metadata: { actor: "user" },
        schemaVersion: "1",
        steps: [{ id: "s1", type: "tool", tool: "write_file", input: { path: "a.ts" }, safety: { riskLevel: "high", requiresApproval: true } }],
      },
      governance: {
        policiesAttached: true,
        constitutionalSafe: true,
        containmentActive: false,
        freezeActive: false,
        operatorSupremacyPreserved: true,
        governanceVersion: "g1",
      },
    });
    const snapshot = createValidationSnapshot({ result, schemaVersion: "1", executionEligible: result.executionEligible });

    const eligibility = evaluateExecutionEligibility({
      result,
      snapshot,
      approvalGranted: false,
      currentPlanHash: result.planHash,
      currentGovernanceDecisionHash: result.governanceDecisionHash,
      currentSchemaVersion: "1",
      governanceVersion: "g1",
    });

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons).toContain("APPROVAL_REQUIRED");
  });

  it("blocks changed hashes and versions", () => {
    const result = makeValidResult();
    const snapshot = createValidationSnapshot({ result, schemaVersion: "1", executionEligible: result.executionEligible });

    const eligibility = evaluateExecutionEligibility({
      result,
      snapshot,
      approvalGranted: true,
      currentPlanHash: `${result.planHash}-changed`,
      currentGovernanceDecisionHash: `${result.governanceDecisionHash}-changed`,
      currentSchemaVersion: "2",
      validatorVersion: "4.0C-drift",
      registryVersion: "planner-registry-2.0.0",
      governanceVersion: "g2",
    });

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons).toContain("VALIDATION_PLAN_HASH_MISMATCH");
    expect(eligibility.reasons).toContain("VALIDATION_GOVERNANCE_HASH_MISMATCH");
    expect(eligibility.reasons).toContain("VALIDATION_VERSION_MISMATCH");
  });
});
