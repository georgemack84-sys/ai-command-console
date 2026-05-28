import { describe, expect, it } from "vitest";

import { scoreResilienceState } from "@/services/resilience/resilienceScoring";

describe("scoreResilienceState", () => {
  it("marks verified when scores are high and no freeze applies", () => {
    const result = scoreResilienceState({
      survivabilityScore: 0.9,
      constitutionalIntegrityScore: 0.92,
      operationalRiskScore: 0.12,
      collapseProbability: 0.08,
      degradationVelocity: 0.1,
      governanceIntegrity: 0.94,
      continuityIntegrity: 0.91,
      escalationPressure: 0.11,
      stabilizationConfidence: 0.86,
      requiresContainment: false,
      requiresFreeze: false,
      requiresEscalation: false,
      requiresOperatorIntervention: false,
      disputedConditions: [],
      resilienceViolations: [],
      affectedSubsystems: [],
      generatedAt: "2026-05-09T00:00:00.000Z",
    });

    expect(result.resilienceState).toBe("VERIFIED");
  });
});
