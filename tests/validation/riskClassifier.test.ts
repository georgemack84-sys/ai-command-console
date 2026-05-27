import { describe, expect, it } from "vitest";

import { classifyPlanRisk } from "@/services/validation/riskClassifier";
import { PLANNER_TOOL_REGISTRY } from "@/services/validation/validationPolicies";

describe("classifyPlanRisk", () => {
  it("escalates to high for external mutation", () => {
    const result = classifyPlanRisk({
      steps: [{ id: "s1", type: "tool", tool: "write_file", input: {}, safety: { riskLevel: "high", requiresApproval: true } }],
      registry: PLANNER_TOOL_REGISTRY,
      approval: { approvalRequired: true, blocking: true, approvalReasons: [], approvalSteps: ["s1"] },
      governanceBlocked: false,
    });

    expect(result).toBe("high");
  });
});
