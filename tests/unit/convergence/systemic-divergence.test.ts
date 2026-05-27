import { describe, expect, it } from "vitest";

import { evaluateContinuityConvergence } from "@/services/convergence/continuityConvergenceEngine";

describe("evaluateContinuityConvergence systemic divergence", () => {
  it("triggers escalation recommendation for systemic risk", () => {
    const result = evaluateContinuityConvergence({
      executionId: "execution_1",
      timestamp: "2026-05-09T00:00:00.000Z",
      continuity: {
        continuityConfidence: 0.1,
        degradedDependencies: ["db", "workers"],
        replayDivergenceDetected: true,
      },
      stability: {
        survivabilityScore: 0.08,
        degradationRate: 0.9,
        escalationPressure: 0.8,
        replayInstabilityScore: 0.9,
        dependencyInstabilityScore: 0.8,
        staleExecutionSpread: 0.7,
        continuityConfidence: 0.1,
        unstableSubsystems: ["db", "replay"],
        disputed: false,
        lockdownRecommended: true,
      } as never,
      escalation: {
        escalationState: "EMERGENCY",
        frozen: true,
        conflictingEscalations: ["esc_2"],
      } as never,
    });

    expect(result.result.requiresEscalation).toBe(true);
  });
});
