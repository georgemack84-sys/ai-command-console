import { describe, expect, it } from "vitest";
import { confidenceBand } from "@/src/nuru/confidence";
import { NuruConfidenceService } from "@/src/server/services/nuru-confidence-service";
import { NuruGovernanceGate } from "@/src/server/services/nuru-governance-gate";

describe("Nuru confidence model", () => {
  it("uses one published confidence scale", () => {
    expect([confidenceBand(0.39), confidenceBand(0.4), confidenceBand(0.7), confidenceBand(0.9)]).toEqual(["LOW", "MODERATE", "HIGH", "VERY_HIGH"]);
  });

  it("does not turn very high confidence into authority", () => {
    const assessment = NuruConfidenceService.assess({ confidence: 0.98, evidenceQuality: "STRONG", sourceAuthority: "LOW", conflictDetected: true, minimumConfidence: 0.7, policySatisfied: true });
    expect(assessment).toMatchObject({ band: "VERY_HIGH", eligibleForGovernance: false, reviewRequired: true });
    const decision = NuruGovernanceGate.evaluate({ proposalId: "proposal-confidence", recommendation: "ACCEPT", qualityStatus: "CONFLICT", confidence: 0.98, evidenceQuality: "STRONG", sourceAuthority: "LOW", requiredReview: false, humanApproved: true, conflictDetected: true, correlationId: "confidence-case" });
    expect(decision).toMatchObject({ outcome: "HUMAN_REVIEW_REQUIRED" });
    expect(decision.reasons.join(" ")).toMatch(/Low-authority.*conflict/i);
  });
});
