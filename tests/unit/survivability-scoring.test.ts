import { describe, expect, it } from "vitest";

import { computeSurvivabilityScore } from "../../services/runtime/survivabilityScoring";

describe("survivability scoring", () => {
  it("drops survivability when risk and replay divergence rise", () => {
    const stable = computeSurvivabilityScore({
      continuityRiskScore: 10,
      workerAvailabilityScore: 1,
      dependencyStabilityScore: 1,
      replayDivergenceDetected: false,
    });
    const unstable = computeSurvivabilityScore({
      continuityRiskScore: 80,
      workerAvailabilityScore: 0.4,
      dependencyStabilityScore: 0.5,
      replayDivergenceDetected: true,
    });

    expect(stable).toBeGreaterThan(unstable);
  });
});
