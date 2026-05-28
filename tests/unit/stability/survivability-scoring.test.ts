import { describe, expect, it } from "vitest";

import { scoreOperationalSurvivability } from "@/services/stability/survivabilityScoring";

describe("scoreOperationalSurvivability", () => {
  it("produces low risk for high confidence and low pressure", () => {
    expect(scoreOperationalSurvivability({
      continuityConfidence: 0.96,
      recoverySuccessConfidence: 0.94,
      replayInstabilityScore: 0.02,
      staleExecutionSpread: 0.01,
      dependencyInstabilityScore: 0.02,
      escalationPressure: 0.01,
      degradationRate: 0.05,
    }).riskLevel).toBe("LOW");
  });

  it("elevates risk for divergence and stale executions", () => {
    const result = scoreOperationalSurvivability({
      continuityConfidence: 0.55,
      replayInstabilityScore: 0.72,
      staleExecutionSpread: 0.64,
      escalationPressure: 0.45,
      degradationRate: 0.68,
    });
    expect(["HIGH", "CRITICAL", "CATASTROPHIC"]).toContain(result.riskLevel);
  });

  it("treats disputed stewardship as high caution", () => {
    const result = scoreOperationalSurvivability({
      continuityConfidence: 0.62,
      disputed: true,
      degradationRate: 0.5,
    });
    expect(["HIGH", "CRITICAL", "CATASTROPHIC"]).toContain(result.riskLevel);
  });

  it("recommends lockdown for catastrophic collapse risk", () => {
    expect(scoreOperationalSurvivability({
      continuityConfidence: 0.18,
      collapseRisk: 0.98,
      containmentRequired: true,
      trend: "COLLAPSING",
    }).lockdownRecommended).toBe(true);
  });

  it("requires stabilization when freeze is required", () => {
    expect(scoreOperationalSurvivability({
      continuityConfidence: 0.8,
      freezeRequired: true,
    }).stabilizationRequired).toBe(true);
  });
});
