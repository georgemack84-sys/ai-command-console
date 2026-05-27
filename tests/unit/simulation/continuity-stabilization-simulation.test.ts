import { describe, expect, it } from "vitest";

import { simulateContinuityStabilization } from "@/services/simulation/continuityStabilizationSimulation";

describe("simulateContinuityStabilization", () => {
  it("projects escalation when continuity remains unstable", () => {
    const result = simulateContinuityStabilization({
      scenario: { simulationType: "CONTINUITY_STABILIZATION", disputed: false, frozen: false } as never,
      input: {
        dashboard: {
          continuityConfidence: 0.32,
          continuityConvergence: { continuityConfidence: 0.31, divergenceScore: 0.6 },
          operationalStabilityAssessment: { survivabilityScore: 0.35, escalationPressure: 0.72 },
          stewardship: { survivabilityScore: 0.36 },
        },
      } as never,
    });

    expect(result.projectedEscalations).toContain("stabilization_review_required");
  });
});
