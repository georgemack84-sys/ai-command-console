import { describe, expect, it } from "vitest";

import { applyPrioritizationPolicies } from "@/services/prioritization/prioritizationPolicies";

describe("applyPrioritizationPolicies", () => {
  it("freezes deeply constitutional and divergent assessments", () => {
    const assessment = applyPrioritizationPolicies({
      executionId: "exec_1",
      prioritizationScore: 0.95,
      category: "STANDARD",
      state: "SCORING",
      operationalCriticality: 0.8,
      survivabilityImpact: 0.85,
      governanceRisk: 0.4,
      replayConfidence: 0.7,
      escalationSeverity: 0.5,
      dependencyImportance: 0.4,
      continuityStability: 0.25,
      tenantImpact: 0.3,
      convergenceConfidence: 0.6,
      divergenceScore: 0.82,
      runtimeDriftSeverity: 0.7,
      staleOwnershipRisk: 0.4,
      orphanedOperationRisk: 0.3,
      replayDivergenceRisk: 0.5,
      constitutionalRisk: 0.91,
      containmentPressure: 0.5,
      recoveryComplexity: 0.5,
      recoveryUrgency: 0.8,
      deterministicRank: -1,
      governanceReviewRequired: false,
      prioritizationReasons: [],
      prioritizationWarnings: [],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(assessment.state).toBe("FROZEN");
    expect(assessment.category).toBe("CONSTITUTIONAL_CRITICAL");
  });
});
