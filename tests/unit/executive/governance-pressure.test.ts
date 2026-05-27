import { describe, expect, it } from "vitest";

import { buildGovernancePressureMatrix } from "@/services/executive/governancePressureAnalysis";

describe("governance pressure", () => {
  it("computes governance pressure deterministically", () => {
    const result = buildGovernancePressureMatrix({
      governanceIntegrity: 0.62,
      escalationPressure: 0.58,
      pendingApprovals: 3,
      containmentRequired: true,
      survivabilityState: "SURVIVABILITY_MODE",
      autonomyBlockedActions: 2,
      operationalRisk: 0.54,
      constitutionalState: "RESTRICTED",
    });

    expect(result.governanceIntegrity).toBe(0.62);
    expect(result.containmentPressure).toBeGreaterThan(0.5);
  });
});
