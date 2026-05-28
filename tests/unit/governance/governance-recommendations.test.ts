import { describe, expect, it } from "vitest";

import { buildGovernanceRecommendation, buildGovernanceRecommendations } from "@/services/governance/governanceRecommendations";

describe("governanceRecommendations", () => {
  it("forces advisory-only recommendations", () => {
    const recommendation = buildGovernanceRecommendation({
      source: "system",
      observedIssue: "Escalation saturation",
      category: "ESCALATION_TUNING",
      recommendation: "Review escalation tuning thresholds under operator supervision.",
      justification: ["escalation_pressure_observed"],
      operationalImpact: "Improves supervisory control without changing live authority.",
      constitutionalRisk: "Moderate",
      confidence: 0.7,
      requiresApproval: true,
    });

    expect(recommendation.advisoryOnly).toBe(true);
    expect(recommendation.recommendationId).toContain("govrec:");
  });

  it("limits collapsing states to stabilization and emergency containment review", () => {
    const recommendations = buildGovernanceRecommendations({
      source: "sovereignty",
      observedIssue: "Collapse indicators",
      currentRiskLevel: "CRITICAL",
      sovereigntyAssessment: {
        sovereigntyState: "COLLAPSING",
        governanceIntegrity: 0.21,
        survivabilityConfidence: 0.19,
        systemicRisk: 0.91,
        containmentEffectiveness: 0.22,
        escalationPressure: 0.82,
        emergencyControlsRequired: true,
        unstableDomains: ["governance_integrity"],
      },
      constitutionalContext: {
        immutableTruthAffected: false,
        approvalRequired: true,
        escalationRequired: true,
        disputedStatePresent: false,
      },
    });

    expect(recommendations.every((entry) => ["STABILIZATION_STRATEGY", "EMERGENCY_CONTAINMENT_REVIEW"].includes(entry.category))).toBe(true);
  });
});
