import { describe, expect, it } from "vitest";

import { prioritizeRecoveries } from "@/services/prioritization/recoveryPrioritization";

describe("prioritizeRecoveries", () => {
  it("fails closed on insufficient evidence", () => {
    const result = prioritizeRecoveries({
      candidates: [{
        executionId: "exec_1",
        evidence: [],
      }],
      evidence: [],
      timestamp: "2026-05-09T00:00:00.000Z",
    } as never);

    expect(result.prioritizationApproved).toBe(false);
    expect(result.recoveryQueue).toEqual([]);
  });

  it("ranks recoveries deterministically and explainably", () => {
    const result = prioritizeRecoveries({
      candidates: [
        {
          executionId: "exec_normal",
          survivabilityImpact: 0.5,
          governanceRisk: 0.3,
          replayConfidence: 0.8,
          evidence: ["event_1"],
        },
        {
          executionId: "exec_constitutional",
          survivabilityImpact: 0.8,
          governanceRisk: 0.4,
          replayConfidence: 0.9,
          evidence: ["event_2"],
        },
      ],
      evidence: ["bundle_1"],
      timestamp: "2026-05-09T00:00:00.000Z",
      convergence: {
        converged: false,
        state: "ESCALATED",
        divergenceScore: 0.72,
        divergenceReasons: ["systemic_pressure"],
        requiresContainment: false,
        requiresEscalation: true,
        requiresFreeze: false,
        continuityConfidence: 0.5,
        replayConfidence: 0.75,
        survivabilityConfidence: 0.4,
        escalationStabilityConfidence: 0.45,
        affectedExecutions: ["exec_constitutional"],
        affectedSubsystems: ["recovery"],
        orphanedOperations: [],
        staleOwnershipClaims: [],
        unresolvedDisputes: [],
        unstableDependencies: ["redis"],
        evidence: ["conv_1"],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      stability: {
        survivabilityScore: 0.35,
        containmentRecommended: false,
        lockdownRecommended: false,
        stabilizationRequired: true,
        confidence: 0.6,
      } as never,
      stewardship: {
        confidence: 0.7,
      },
    });

    expect(result.deterministicOrderingVerified).toBe(true);
    expect(result.assessments[0].executionId).toBe("exec_constitutional");
    expect(result.assessments[0].prioritizationReasons.length).toBeGreaterThan(0);
  });
});
