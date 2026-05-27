import { describe, expect, it } from "vitest";

import { modelStrategicSurvivability } from "@/services/continuity/survivabilityModel";

describe("modelStrategicSurvivability", () => {
  it("computes deterministic survivability score and trajectory", () => {
    const input = {
      governanceConfidence: 0.82,
      stabilityScore: 0.74,
      containmentConfidence: 0.78,
      escalationPressure: 0.28,
      collapseRisk: 0.18,
      dependencyResilience: 0.7,
    };

    const left = modelStrategicSurvivability(input);
    const right = modelStrategicSurvivability(input);

    expect(left).toEqual(right);
    expect(left.survivabilityScore).toBeGreaterThan(0.6);
    expect(left.continuityTrajectory).toBe("STABLE");
  });
});
