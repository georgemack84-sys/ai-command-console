import { describe, expect, it } from "vitest";

import { evaluateAdaptiveGovernance } from "@/services/governance/adaptiveGovernanceEngine";

describe("adaptive governance collapse state", () => {
  it("blocks normal recommendations during collapse", () => {
    const result = evaluateAdaptiveGovernance({
      source: "sovereignty",
      observedIssue: "Collapse indicators",
      evidence: ["sovereignty:a", "continuity:b", "validation:c"],
      affectedSystems: ["continuity", "containment"],
      currentRiskLevel: "CRITICAL",
      sovereigntyAssessment: {
        sovereigntyState: "COLLAPSING",
        governanceIntegrity: 0.2,
        survivabilityConfidence: 0.18,
        systemicRisk: 0.93,
        containmentEffectiveness: 0.22,
        escalationPressure: 0.87,
        emergencyControlsRequired: true,
        unstableDomains: ["survivability_loss"],
      },
      constitutionalContext: {
        immutableTruthAffected: false,
        approvalRequired: true,
        escalationRequired: true,
        disputedStatePresent: false,
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.recommendations.every((entry) => ["STABILIZATION_STRATEGY", "EMERGENCY_CONTAINMENT_REVIEW"].includes(entry.category))).toBe(true);
  });
});
