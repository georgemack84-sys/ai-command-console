import { describe, expect, it } from "vitest";

import { buildRecoveryForecasting } from "@/services/simulation/recoveryForecasting";

describe("buildRecoveryForecasting", () => {
  it("aggregates read-only simulations into an advisory forecast summary", () => {
    const result = buildRecoveryForecasting({
      dashboard: {
        activeRecoveries: [{ executionId: "exec_1" }],
        blockedRecoveries: [{ executionId: "exec_2" }],
        quarantinedExecutions: [],
        auditHistory: [{ id: "audit_1" }, { id: "audit_2" }],
        continuityConfidence: 0.55,
        degradedSystems: ["workers"],
        governanceDisputes: [],
        replayDivergenceCount: 0,
        operationalStabilityAssessment: {
          survivabilityScore: 0.52,
          escalationPressure: 0.44,
          continuityConfidence: 0.55,
          containmentRecommended: false,
        },
        stewardship: {
          survivabilityScore: 0.57,
          confidence: 0.68,
          shouldFreeze: false,
        },
        continuityConvergence: {
          converged: true,
          continuityConfidence: 0.58,
          replayConfidence: 0.72,
          survivabilityConfidence: 0.63,
          divergenceScore: 0.32,
          evidence: ["audit_1"],
        },
        recoveryPrioritization: {
          prioritizationConfidence: 0.64,
          governanceReviewRequired: false,
        },
      },
    } as never);

    expect(result.summary.advisoryOnly).toBe(true);
    expect(result.summary.simulations.length).toBe(7);
  });
});
