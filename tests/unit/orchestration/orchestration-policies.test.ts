import { describe, expect, it } from "vitest";

import { evaluateOrchestrationPolicies } from "@/services/orchestration/orchestrationPolicies";

describe("evaluateOrchestrationPolicies", () => {
  it("fails closed on unknown policy state", () => {
    const result = evaluateOrchestrationPolicies({
      allowed: false,
      constitutionalState: "LOCKED",
      validationValid: false,
      escalationLoopDetected: true,
      containmentRequired: true,
    });

    expect(result.authorized).toBe(false);
    expect(result.locked).toBe(true);
    expect(result.blockedReasons).toContain("validation_failure_blocks_orchestration");
  });
});
