import { describe, expect, it } from "vitest";

import { applyRecoveryDecisionPolicies } from "@/services/decision/recoveryDecisionPolicies";

describe("applyRecoveryDecisionPolicies", () => {
  it("requires governance review for destructive or disputed paths", () => {
    const result = applyRecoveryDecisionPolicies({
      constitutionalAction: "REQUIRE_APPROVAL",
      constitutionallyAllowed: false,
      governanceRisk: 0.72,
      continuityImpact: 0.64,
      requiresContainment: false,
      requiresEscalation: true,
      disputed: true,
    });

    expect(result.recommendedAction).toBe("GOVERNANCE_REVIEW");
    expect(result.requiresApproval).toBe(true);
  });
});
