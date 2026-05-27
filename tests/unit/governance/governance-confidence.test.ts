import { describe, expect, it } from "vitest";

import { evaluateGovernanceConfidence } from "@/services/governance/governanceConfidence";

describe("evaluateGovernanceConfidence", () => {
  it("degrades confidence during instability and disputed truth", () => {
    const result = evaluateGovernanceConfidence({
      evidenceCount: 1,
      expectedEvidenceCount: 3,
      disputedTruthPresent: true,
      sovereigntyAssessment: {
        sovereigntyState: "GOVERNANCE_RISK",
        governanceIntegrity: 0.32,
        survivabilityConfidence: 0.44,
        systemicRisk: 0.72,
        containmentEffectiveness: 0.41,
        escalationPressure: 0.76,
        emergencyControlsRequired: false,
        unstableDomains: ["governance_integrity"],
      },
    });

    expect(result.confidenceBand).toBe("LOW");
    expect(result.requiresHumanReview).toBe(true);
    expect(result.reasons).toContain("disputed_truth_present");
  });
});
