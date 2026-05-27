import { describe, expect, it } from "vitest";

import { evaluateAdaptiveGovernance } from "@/services/governance/adaptiveGovernanceEngine";

describe("emergency containment advisory", () => {
  it("recommends emergency containment review without executing it", () => {
    const result = evaluateAdaptiveGovernance({
      source: "sovereignty",
      observedIssue: "Emergency containment state",
      evidence: ["sovereignty:a", "validation:b", "audit:c"],
      affectedSystems: ["containment"],
      currentRiskLevel: "CRITICAL",
      sovereigntyAssessment: {
        sovereigntyState: "EMERGENCY_CONTAINMENT",
        governanceIntegrity: 0.12,
        survivabilityConfidence: 0.1,
        systemicRisk: 0.98,
        containmentEffectiveness: 0.18,
        escalationPressure: 0.91,
        emergencyControlsRequired: true,
        unstableDomains: ["containment"],
      },
      constitutionalContext: {
        immutableTruthAffected: false,
        approvalRequired: true,
        escalationRequired: true,
        disputedStatePresent: true,
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]?.category).toBe("EMERGENCY_CONTAINMENT_REVIEW");
    expect(result.recommendations[0]?.advisoryOnly).toBe(true);
  });
});
