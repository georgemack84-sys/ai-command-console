import { describe, expect, it } from "vitest";

import { buildRecoveryForecasting } from "@/services/simulation/recoveryForecasting";

describe("recovery simulation forecasting", () => {
  it("keeps collapse-risk forecasts advisory-only and lineage-preserving", () => {
    const result = buildRecoveryForecasting({
      dashboard: {
        activeRecoveries: [{ executionId: "exec_1" }],
        blockedRecoveries: [{ executionId: "exec_2" }],
        quarantinedExecutions: [],
        auditHistory: [{ id: "audit_1" }, { id: "audit_2" }, { id: "audit_3" }],
        continuityConfidence: 0.22,
        degradedSystems: ["replay", "locks"],
        governanceDisputes: [{ executionId: "exec_2" }],
        replayDivergenceCount: 2,
        operationalStabilityAssessment: {
          survivabilityScore: 0.18,
          escalationPressure: 0.81,
          continuityConfidence: 0.24,
          containmentRecommended: true,
        },
        stewardship: {
          survivabilityScore: 0.2,
          confidence: 0.3,
          shouldFreeze: true,
        },
        continuityConvergence: {
          converged: false,
          continuityConfidence: 0.2,
          replayConfidence: 0.15,
          survivabilityConfidence: 0.19,
          divergenceScore: 0.87,
          requiresContainment: true,
          requiresEscalation: true,
          requiresFreeze: true,
          evidence: ["audit_1"],
          staleOwnershipClaims: ["claim_1"],
          unstableDependencies: ["replay"],
        },
        escalationCoordination: {
          frozen: true,
          blocked: false,
        },
        recoveryPrioritization: {
          governanceReviewRequired: true,
          prioritizationConfidence: 0.3,
        },
      },
      nowMs: Date.parse("2026-05-09T00:00:00.000Z"),
    } as never);

    expect(result.summary.advisoryOnly).toBe(true);
    expect(result.summary.collapseRisk).toBeGreaterThan(0.75);
    expect(result.summary.simulations[0].forecastLineage.length).toBeGreaterThan(0);
  });
});
