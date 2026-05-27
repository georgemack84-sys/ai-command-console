import { describe, expect, it } from "vitest";

import { buildContainmentPolicies } from "@/services/containment/containmentPolicies";

describe("constitutional containment", () => {
  it("preserves constitutional integrity precedence over runtime recovery", () => {
    const result = buildContainmentPolicies({
      constitutionalIntegrity: 0.29,
      governanceCollapseRisk: 0.81,
      survivabilityConfidence: 0.22,
      containmentEffectiveness: 0.48,
      escalationPressure: 0.76,
      systemicInstability: 0.84,
    });

    expect(["FREEZE", "CONTAIN", "ISOLATE", "QUARANTINE", "DENY"]).toContain(result.recommendedAction);
  });
});
