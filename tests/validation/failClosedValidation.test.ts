import { describe, expect, it } from "vitest";

import { validatePlanDraft } from "@/services/validation/planValidator";

describe("fail-closed validation", () => {
  it("blocks when governance is absent", () => {
    const result = validatePlanDraft({
      plan: {
        planId: "plan_1",
        intent: "safe read",
        metadata: { actor: "user" },
        schemaVersion: "1",
        steps: [{ id: "s1", type: "tool", tool: "read_file", input: {}, safety: { riskLevel: "low", requiresApproval: false } }],
      },
    });

    expect(result.validationState).toBe("BLOCKED");
    expect(result.blockedReasons).toContain("GOVERNANCE_VALIDATION_FAILED");
  });
});
