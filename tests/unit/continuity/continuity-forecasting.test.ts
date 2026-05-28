import { describe, expect, it } from "vitest";

import { forecastStrategicContinuity } from "@/services/continuity/continuityForecasting";

describe("forecastStrategicContinuity", () => {
  it("preserves deterministic forecasting and fail-closed uncertainty", () => {
    const result = forecastStrategicContinuity({
      survivabilityScore: 0.42,
      escalationPressure: 0.71,
      governancePressure: 0.68,
      containmentConfidence: 0.36,
      stabilizationConfidence: 0.4,
      disputedTruth: true,
    });

    expect(result.collapseRisk).toBeGreaterThan(0.7);
    expect(result.continuityTrajectory).toBe("UNSTABLE");
    expect(result.recommendedActions).toContain("explain_uncertainty");
  });
});
