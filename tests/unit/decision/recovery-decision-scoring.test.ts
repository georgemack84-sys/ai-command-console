import { describe, expect, it } from "vitest";

import { scoreRecoveryDecision } from "@/services/decision/recoveryDecisionScoring";

describe("scoreRecoveryDecision", () => {
  it("degrades confidence under disputes and low trust", () => {
    const result = scoreRecoveryDecision({
      governanceRisk: 0.8,
      continuityImpact: 0.7,
      operationalTrustProjection: 0.2,
      evidenceQuality: 0.3,
      disputed: true,
      containmentPressure: 0.6,
    });

    expect(result.decisionConfidence).toBeLessThan(0.5);
    expect(result.uncertaintyLevel).toBe("CRITICAL");
  });
});
