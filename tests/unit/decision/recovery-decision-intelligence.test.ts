import { describe, expect, it } from "vitest";

import { buildRecoveryDecisionIntelligence } from "@/services/decision/recoveryDecisionIntelligence";

describe("buildRecoveryDecisionIntelligence", () => {
  it("blocks recovery when constitutional enforcement denies it", () => {
    const result = buildRecoveryDecisionIntelligence({
      executionId: "exec_1",
      evidence: {
        dashboard: {
          replayVerificationState: "DIVERGED",
          governanceDisputes: [{ executionId: "exec_1" }],
          continuityConvergence: { divergenceScore: 0.8, requiresContainment: true, requiresFreeze: true },
          stewardship: { shouldFreeze: true },
          recoveryPrioritization: { governanceReviewRequired: true },
        },
        forecasting: {
          summary: {
            advisoryOnly: true,
            collapseRisk: 0.82,
            containmentPressure: 0.74,
            governanceInstabilityRisk: 0.8,
            simulations: [],
            confidenceDegradationReasons: ["governance_disputes_present"],
            evidenceSufficient: false,
            operationalTrustProjection: 0.2,
            generatedAt: "2026-05-09T00:00:00.000Z",
          },
        },
      } as never,
      generatedAt: "2026-05-09T00:00:00.000Z",
    });

    expect(result.constitutionallyAllowed).toBe(false);
    expect(result.constitutionalAction).toBe("DENY");
    expect(result.mutable).toBe(false);
  });
});
