import { describe, expect, it } from "vitest";

import { scoreRecoveryCandidate } from "@/services/prioritization/prioritizationScoring";

describe("scoreRecoveryCandidate", () => {
  it("scores deterministically from convergence and candidate signals", () => {
    const assessment = scoreRecoveryCandidate({
      candidate: {
        executionId: "exec_1",
        evidence: ["event_1"],
        governanceRisk: 0.8,
        replayConfidence: 0.7,
      },
      convergence: {
        convergenceConfidence: 0.7,
        divergenceScore: 0.6,
        runtimeDriftSeverity: 0.5,
        staleOwnershipRisk: 0.2,
        orphanedOperationRisk: 0.1,
        replayDivergenceRisk: 0.45,
        constitutionalRisk: 0.75,
        containmentPressure: 0.35,
        warnings: [],
      },
      survivabilityImpact: 0.8,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(assessment.prioritizationScore).toBeGreaterThan(0.5);
    expect(assessment.executionId).toBe("exec_1");
  });
});
