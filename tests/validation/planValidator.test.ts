import { describe, expect, it } from "vitest";

import { validatePlanDraft } from "@/services/validation/planValidator";

describe("validatePlanDraft", () => {
  it("returns REQUIRES_APPROVAL for governed but approval-gated plans", () => {
    const result = validatePlanDraft({
      plan: {
        planId: "plan_1",
        intent: "update file",
        metadata: { actor: "user" },
        schemaVersion: "1",
        steps: [{ id: "s1", type: "tool", tool: "write_file", input: {}, safety: { riskLevel: "high", requiresApproval: true } }],
      },
      governance: {
        policiesAttached: true,
        constitutionalSafe: true,
        containmentActive: false,
        freezeActive: false,
        operatorSupremacyPreserved: true,
      },
    });

    expect(result.validationState).toBe("REQUIRES_APPROVAL");
    expect(result.approvalRequired).toBe(true);
    expect(result.valid).toBe(false);
  });
});
