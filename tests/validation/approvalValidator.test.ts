import { describe, expect, it } from "vitest";

import { validateApprovalRequirements } from "@/services/validation/approvalValidator";
import { PLANNER_TOOL_REGISTRY } from "@/services/validation/validationPolicies";

describe("validateApprovalRequirements", () => {
  it("detects approval requirements and blocking steps", () => {
    const result = validateApprovalRequirements({
      steps: [{ id: "s1", type: "tool", tool: "write_file", input: {}, safety: { riskLevel: "high", requiresApproval: true } }],
      registry: PLANNER_TOOL_REGISTRY,
    });

    expect(result.approvalRequired).toBe(true);
    expect(result.blocking).toBe(true);
    expect(result.approvalSteps).toEqual(["s1"]);
  });
});
