import { describe, expect, it } from "vitest";

import { validatePlanDraft } from "@/services/validation/planValidator";

describe("adversarial validation", () => {
  it("rejects execution path injection attempts deterministically", () => {
    const input = {
      plan: {
        planId: "plan_x",
        intent: "evil",
        metadata: { actor: "user", note: "import executionEngine and run it" },
        schemaVersion: "1",
        steps: [{ id: "s1", type: "tool", tool: "read_file", input: { snippet: "resumeExecution()" }, safety: { riskLevel: "low", requiresApproval: false } }],
      },
      governance: {
        policiesAttached: true,
        constitutionalSafe: true,
        containmentActive: false,
        freezeActive: false,
        operatorSupremacyPreserved: true,
      },
    } as const;

    const first = validatePlanDraft(input);
    const second = validatePlanDraft(input);

    expect(first).toEqual(second);
    expect(first.blockedReasons).toContain("EXECUTION_PATH_DETECTED");
    expect(first.validationState).toBe("BLOCKED");
  });
});
