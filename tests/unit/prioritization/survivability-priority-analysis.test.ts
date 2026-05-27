import { describe, expect, it } from "vitest";

import { analyzeSurvivabilityPriority } from "@/services/prioritization/survivabilityPriorityAnalysis";

describe("analyzeSurvivabilityPriority", () => {
  it("requires survivability priority under collapse pressure", () => {
    const result = analyzeSurvivabilityPriority({
      survivabilityScore: 0.1,
      containmentRecommended: true,
      lockdownRecommended: true,
      stabilizationRequired: true,
    } as never);

    expect(result.survivabilityPriorityRequired).toBe(true);
    expect(result.survivabilityImpact).toBeGreaterThan(0.8);
  });
});
