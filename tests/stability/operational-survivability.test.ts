import { describe, expect, it } from "vitest";

import { buildCivilizationRiskAssessment } from "@/services/civilization/civilizationRiskAssessment";

describe("buildCivilizationRiskAssessment", () => {
  it("surfaces civilization-scale risk without fabricating continuation", () => {
    const result = buildCivilizationRiskAssessment({
      systemicRisk: 0.81,
      survivabilityConfidence: 0.39,
      autonomyRisk: 0.72,
      operationalStability: 0.44,
    });

    expect(result.civilizationScaleRisk).toBeGreaterThan(0.7);
    expect(result.failClosed).toBe(true);
  });
});
