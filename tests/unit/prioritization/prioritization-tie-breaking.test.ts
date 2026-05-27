import { describe, expect, it } from "vitest";

import { assignDeterministicRanks } from "@/services/prioritization/prioritizationTieBreaking";

describe("assignDeterministicRanks", () => {
  it("uses deterministic lexical ordering as the final tie-breaker", () => {
    const ranked = assignDeterministicRanks([
      { executionId: "exec_b", constitutionalRisk: 0.5, survivabilityImpact: 0.5, continuityStability: 0.5, divergenceScore: 0.5, replayConfidence: 0.8, state: "SCORING", timestamp: "2026-05-09T00:00:00.000Z" },
      { executionId: "exec_a", constitutionalRisk: 0.5, survivabilityImpact: 0.5, continuityStability: 0.5, divergenceScore: 0.5, replayConfidence: 0.8, state: "SCORING", timestamp: "2026-05-09T00:00:00.000Z" },
    ] as never);

    expect(ranked[0].executionId).toBe("exec_a");
    expect(ranked[0].deterministicRank).toBe(1);
  });
});
