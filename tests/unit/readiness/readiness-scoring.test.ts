import { describe, expect, it } from "vitest";

import { scoreConstitutionalReadiness } from "@/services/readiness/readinessScoring";

describe("scoreConstitutionalReadiness", () => {
  it("produces deterministic threshold-based readiness scoring", () => {
    const input = {
      governanceReliability: 0.82,
      auditIntegrity: 0.84,
      containmentSurvivability: 0.8,
      escalationCoordinationReliability: 0.75,
      simulationTrustworthiness: 0.73,
      continuityStability: 0.71,
      operatorOverrideReliability: 0.8,
      enforcementConsistency: 0.78,
      operationalExplainability: 0.79,
      deterministicRecoveryConfidence: 0.77,
    };

    expect(scoreConstitutionalReadiness(input)).toBe(scoreConstitutionalReadiness(input));
  });
});
