import { describe, expect, it } from "vitest";

import { forecastRecoverySurvivability } from "@/services/stewardship/recoverySurvivabilityForecaster";

describe("forecastRecoverySurvivability", () => {
  it("produces deterministic survivability forecasts", () => {
    const first = forecastRecoverySurvivability({
      continuityConfidence: 0.82,
      replayDivergence: false,
      simulationOutcome: "RECOVERY_VALID_WITH_WARNINGS",
      certificationDecision: "CERTIFIED_WITH_WARNINGS",
      governanceBlocked: false,
      stabilizationStatus: "stabilizing",
    });
    const second = forecastRecoverySurvivability({
      continuityConfidence: 0.82,
      replayDivergence: false,
      simulationOutcome: "RECOVERY_VALID_WITH_WARNINGS",
      certificationDecision: "CERTIFIED_WITH_WARNINGS",
      governanceBlocked: false,
      stabilizationStatus: "stabilizing",
    });

    expect(first).toEqual(second);
  });
});
