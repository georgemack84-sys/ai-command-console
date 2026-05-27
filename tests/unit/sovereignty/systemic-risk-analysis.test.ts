import { describe, expect, it } from "vitest";

import { analyzeSystemicRisk } from "@/services/sovereignty/systemicRiskAnalysis";

describe("analyzeSystemicRisk", () => {
  it("detects runaway autonomy and escalation saturation", () => {
    const result = analyzeSystemicRisk({
      runawayAutonomySignals: 0.88,
      governanceFailures: 0.74,
      recoveryLoopSignals: 0.79,
      crossDomainInstability: 0.62,
      escalationSaturation: 0.82,
      survivabilityLoss: 0.7,
      constitutionalDegradation: 0.64,
    });

    expect(result.systemicRisk).toBeGreaterThan(0.7);
    expect(result.unstableDomains).toContain("autonomy_coordination");
    expect(result.unstableDomains).toContain("escalation_saturation");
  });
});
