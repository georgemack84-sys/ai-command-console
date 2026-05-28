import { describe, expect, it } from "vitest";

import { computeForecastConfidence } from "@/services/simulation/forecastConfidence";

describe("computeForecastConfidence", () => {
  it("degrades confidence during disputes and frozen chains", () => {
    const result = computeForecastConfidence({
      baseConfidence: 0.9,
      input: {
        dashboard: {
          auditHistory: [{ id: "a1" }],
          continuityConvergence: { converged: false, requiresFreeze: true, staleOwnershipClaims: ["claim_1"] },
          governanceDisputes: [{ executionId: "exec_1" }],
          stewardship: { shouldFreeze: true },
          escalationCoordination: { frozen: true },
          operationalStabilityAssessment: { escalationPressure: 0.8, containmentRecommended: true },
        },
      } as never,
    });

    expect(result.confidenceScore).toBeLessThan(0.5);
    expect(result.degradationReasons.length).toBeGreaterThan(2);
  });
});
