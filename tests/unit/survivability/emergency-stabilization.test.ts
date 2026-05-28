import { describe, expect, it } from "vitest";

import { evaluateEmergencyStabilization } from "@/services/survivability/emergencyStabilization";

describe("emergency stabilization", () => {
  it("never bypasses governance", () => {
    const result = evaluateEmergencyStabilization({
      survivabilityState: "COLLAPSING",
      constitutionalState: "LOCKED",
      containmentRequired: true,
      emergencyLockActive: true,
      governanceAllowed: false,
    });

    expect(result.required).toBe(true);
    expect(result.bypassAllowed).toBe(false);
  });
});
