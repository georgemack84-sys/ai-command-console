import { describe, expect, it } from "vitest";

import { validateGovernanceConstraints } from "@/services/governance/governanceConstraints";
import { buildGovernanceRecommendation } from "@/services/governance/governanceRecommendations";

describe("validateGovernanceConstraints", () => {
  it("blocks policy mutation and constitutional rewrite attempts", () => {
    const recommendation = buildGovernanceRecommendation({
      source: "system",
      observedIssue: "Unsafe autonomy drift",
      category: "POLICY_ADJUSTMENT",
      recommendation: "Auto-apply and rewrite constitutional rules immediately.",
      justification: ["unsafe_request_detected"],
      operationalImpact: "Unsafe",
      constitutionalRisk: "High",
      confidence: 0.9,
      requiresApproval: false,
    });

    const result = validateGovernanceConstraints({
      recommendations: [recommendation],
      constitutionalContext: {
        immutableTruthAffected: false,
        approvalRequired: false,
        escalationRequired: false,
        disputedStatePresent: false,
      },
    });

    expect(result.allowedRecommendations).toHaveLength(0);
    expect(result.blockedRecommendations).toContain(recommendation.recommendationId);
  });
});
