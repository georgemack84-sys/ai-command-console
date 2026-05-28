import { describe, expect, it } from "vitest";

import { evaluateEmergencyContainment } from "@/services/enforcement/emergencyContainment";

describe("evaluateEmergencyContainment", () => {
  it("activates emergency lock during emergency containment", () => {
    const result = evaluateEmergencyContainment({
      sovereigntyState: "EMERGENCY_CONTAINMENT",
      constitutionalState: "CONSTITUTIONAL",
      disputedTruthPresent: false,
      containmentRequired: true,
      freezeActive: false,
    });

    expect(result.emergencyLockActive).toBe(true);
    expect(result.containmentApplied).toBe(true);
  });
});
