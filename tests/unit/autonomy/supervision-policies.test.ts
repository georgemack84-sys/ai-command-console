import { describe, expect, it } from "vitest";

import { evaluateSupervisionPolicies } from "@/services/autonomy/supervisionPolicies";

describe("evaluateSupervisionPolicies", () => {
  it("freezes supervision during critical sovereignty", () => {
    const result = evaluateSupervisionPolicies({
      sovereigntyState: "CRITICAL",
      coordinationRisk: 0.7,
      escalationRequired: true,
      disputedTruthPresent: false,
      emergencyLockActive: false,
    });

    expect(result.supervisionState).toBe("FROZEN");
  });
});
