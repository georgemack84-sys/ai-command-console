import { describe, expect, it } from "vitest";

import { validateGovernance } from "@/services/validation/governanceValidator";
import { PLANNER_TOOL_REGISTRY } from "@/services/validation/validationPolicies";

describe("validateGovernance", () => {
  it("fails closed when governance is missing", () => {
    const result = validateGovernance({
      governance: undefined,
      steps: [],
      registry: PLANNER_TOOL_REGISTRY,
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("GOVERNANCE_VALIDATION_FAILED");
  });

  it("blocks mutation-capable tools during containment", () => {
    const result = validateGovernance({
      governance: {
        policiesAttached: true,
        constitutionalSafe: true,
        containmentActive: true,
        freezeActive: false,
        operatorSupremacyPreserved: true,
      },
      steps: [{ id: "s1", type: "tool", tool: "write_file", input: {}, safety: { riskLevel: "high", requiresApproval: true } }],
      registry: PLANNER_TOOL_REGISTRY,
    });

    expect(result.valid).toBe(false);
  });
});
