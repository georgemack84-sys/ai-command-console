import { describe, expect, it } from "vitest";

import { evaluateConstitutionalFreezePropagation } from "@/services/validation/constitutionalFreezePropagation";
import { createValidationSnapshot } from "@/services/validation/validationSnapshot";
import { evaluateExecutionEligibility } from "@/services/validation/executionEligibilityGate";
import { validatePlanDraft } from "@/services/validation/planValidator";

describe("constitutionalFreezePropagation", () => {
  it("freezes disputed governance and missing audit lineage", () => {
    const freeze = evaluateConstitutionalFreezePropagation({
      governanceDecision: "DISPUTED",
      disputed: true,
      containmentActive: false,
      constitutionalConflict: false,
      operatorSupremacyPreserved: true,
      immutableAuditIdPresent: false,
      driftDetected: false,
      versionConflict: false,
    });

    expect(freeze.frozen).toBe(true);
    expect(freeze.freezeReasons).toContain("governance_disputed");
    expect(freeze.freezeReasons).toContain("immutable_audit_lineage_missing");
  });

  it("blocks eligibility when freeze propagation is active", () => {
    const result = validatePlanDraft({
      plan: {
        planId: "frozen_plan",
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
    const snapshot = createValidationSnapshot({ result, schemaVersion: "1", executionEligible: result.executionEligible });

    const eligibility = evaluateExecutionEligibility({
      result,
      snapshot,
      approvalGranted: true,
      currentPlanHash: result.planHash,
      currentGovernanceDecisionHash: result.governanceDecisionHash,
      currentSchemaVersion: "1",
      freezePropagationActive: true,
    });

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.frozen).toBe(true);
    expect(eligibility.reasons).toContain("VALIDATION_FREEZE_PROPAGATED");
  });
});
