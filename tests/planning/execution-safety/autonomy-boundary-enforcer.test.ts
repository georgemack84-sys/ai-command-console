import { describe, expect, it } from "vitest";

import { enforceAutonomyBoundary } from "@/services/planning/execution-safety/autonomy-boundary-enforcer";

import { buildExecutionSafetyFixture } from "./helpers";

describe("autonomy boundary enforcer", () => {
  it("blocks unsafe autonomy self-elevation", () => {
    const fixture = buildExecutionSafetyFixture();
    fixture.executionTruthPackage.autonomyEnvelope.maxAutonomyLevel = "bounded_autonomous";
    fixture.executionTruthPackage.riskProfile.stepSignals[0] = {
      ...fixture.executionTruthPackage.riskProfile.stepSignals[0]!,
      autonomySensitivity: "critical",
    };

    const autonomy = enforceAutonomyBoundary(fixture.executionTruthPackage);
    expect(autonomy.selfElevationBlocked).toBe(true);
    expect(autonomy.maxAutonomyLevel).not.toBe("bounded_autonomous");
  });
});
