import { describe, expect, it } from "vitest";

import { analyzeContinuityRisk } from "@/services/continuity/continuityRiskAnalysis";

describe("analyzeContinuityRisk", () => {
  it("detects governance degradation, containment weakness, and escalation saturation", () => {
    const result = analyzeContinuityRisk({
      governanceConfidence: 0.34,
      containmentConfidence: 0.28,
      escalationPressure: 0.82,
      disputedTruth: true,
      validationBlockedReasons: ["validation_freeze_required"],
    });

    expect(result.riskSignals).toContain("governance_degradation_detected");
    expect(result.riskSignals).toContain("containment_weakness_detected");
    expect(result.riskSignals).toContain("escalation_saturation_detected");
    expect(result.collapseRisk).toBeGreaterThan(0.7);
  });
});
