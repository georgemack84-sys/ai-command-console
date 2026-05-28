import { describe, expect, it } from "vitest";

import { projectCollapseRisk } from "@/services/simulation/collapseRiskProjection";

describe("projectCollapseRisk", () => {
  it("stays advisory while projecting elevated collapse risk", () => {
    const risk = projectCollapseRisk({
      continuityConvergence: { divergenceScore: 0.85 },
      operationalStabilityAssessment: { survivabilityScore: 0.2, containmentRecommended: true },
      stewardship: { shouldFreeze: true },
    } as never);

    expect(risk).toBeGreaterThan(0.75);
  });
});
