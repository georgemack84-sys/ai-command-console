import { describe, expect, it } from "vitest";

import { validatePlanSchema } from "@/services/validation/schemaValidator";

describe("validatePlanSchema", () => {
  it("accepts a well-formed plan schema", () => {
    const result = validatePlanSchema({
      planId: "plan_1",
      intent: "summarize",
      metadata: { actor: "user" },
      schemaVersion: "1",
      steps: [{ id: "step_1", type: "tool", tool: "read_file", input: {}, safety: { riskLevel: "low", requiresApproval: false } }],
    });

    expect(result.valid).toBe(true);
  });

  it("rejects duplicate step ids and empty plans", () => {
    const result = validatePlanSchema({
      planId: "plan_1",
      intent: "bad",
      metadata: {},
      schemaVersion: "1",
      steps: [
        { id: "step_1", type: "tool", tool: "read_file", input: {}, safety: { riskLevel: "low", requiresApproval: false } },
        { id: "step_1", type: "tool", tool: "read_file", input: {}, safety: { riskLevel: "low", requiresApproval: false } },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("DUPLICATE_STEP_ID");
  });
});
