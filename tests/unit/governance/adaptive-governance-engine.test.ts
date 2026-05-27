import { describe, expect, it } from "vitest";

import { evaluateAdaptiveGovernance } from "@/services/governance/adaptiveGovernanceEngine";

describe("evaluateAdaptiveGovernance", () => {
  it("stays advisory-only and never mutates state", () => {
    const result = evaluateAdaptiveGovernance({
      source: "system",
      observedIssue: "Escalation saturation",
      evidence: ["audit:a", "simulation:b", "coordination:c"],
      affectedSystems: ["escalation", "governance"],
      currentRiskLevel: "HIGH",
      sovereigntyAssessment: {
        sovereigntyState: "UNSTABLE",
        governanceIntegrity: 0.58,
        survivabilityConfidence: 0.52,
        systemicRisk: 0.64,
        containmentEffectiveness: 0.66,
        escalationPressure: 0.72,
        emergencyControlsRequired: false,
        unstableDomains: ["escalation_saturation"],
      },
      constitutionalContext: {
        immutableTruthAffected: false,
        approvalRequired: true,
        escalationRequired: true,
        disputedStatePresent: false,
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.advisoryOnly).toBe(true);
    expect(result.requiresApproval).toBe(true);
    expect(result.recommendations.every((entry) => entry.advisoryOnly)).toBe(true);
  });
});
