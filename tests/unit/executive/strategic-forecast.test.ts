import { describe, expect, it } from "vitest";

import { buildStrategicContinuityForecast } from "@/services/executive/strategicContinuityForecast";

describe("strategic forecast", () => {
  it("produces stable strategic continuity forecasts", () => {
    const input = {
      survivabilityScore: 0.57,
      recoverabilityConfidence: 0.52,
      systemicInstability: 0.48,
      collapseRisk: 0.44,
      containmentRequired: true,
      governanceConfidence: 0.61,
      disputeCount: 1,
      nowMs: 10,
    };

    expect(buildStrategicContinuityForecast(input)).toEqual(buildStrategicContinuityForecast(input));
  });
});
