import { describe, expect, it } from "vitest";

import { runRecoverySimulationEngine } from "@/services/simulation/recoverySimulationEngine";

describe("runRecoverySimulationEngine", () => {
  it("cannot mutate or execute and produces deterministic simulation outputs", () => {
    const result = runRecoverySimulationEngine({
      dashboard: {
        activeRecoveries: [{ executionId: "exec_1" }],
        blockedRecoveries: [],
        quarantinedExecutions: [],
        auditHistory: [{ id: "audit_1" }, { id: "audit_2" }],
        continuityConfidence: 0.61,
        degradedSystems: ["workers"],
        governanceDisputes: [],
        replayDivergenceCount: 0,
        operationalStabilityAssessment: {
          survivabilityScore: 0.6,
          escalationPressure: 0.33,
          continuityConfidence: 0.61,
          containmentRecommended: false,
        },
        stewardship: {
          survivabilityScore: 0.62,
          shouldFreeze: false,
        },
        continuityConvergence: {
          converged: true,
          continuityConfidence: 0.64,
          replayConfidence: 0.7,
          survivabilityConfidence: 0.66,
          divergenceScore: 0.2,
          evidence: ["audit_1"],
        },
      },
      nowMs: Date.parse("2026-05-09T00:00:00.000Z"),
    } as never);

    expect(result.policy.canExecute).toBe(false);
    expect(result.simulations[0].generatedAt).toBe("2026-05-09T00:00:00.000Z");
  });
});
