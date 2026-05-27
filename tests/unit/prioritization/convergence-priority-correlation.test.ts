import { describe, expect, it } from "vitest";

import { correlateConvergencePriority } from "@/services/prioritization/convergencePriorityCorrelation";

describe("correlateConvergencePriority", () => {
  it("raises divergence-related priority signals from convergence outputs", () => {
    const signals = correlateConvergencePriority({
      converged: false,
      state: "ESCALATED",
      divergenceScore: 0.8,
      divergenceReasons: ["replay_divergence_detected"],
      requiresContainment: true,
      requiresEscalation: true,
      requiresFreeze: false,
      continuityConfidence: 0.3,
      replayConfidence: 0.2,
      survivabilityConfidence: 0.35,
      escalationStabilityConfidence: 0.4,
      affectedExecutions: ["exec_1"],
      affectedSubsystems: ["replay"],
      orphanedOperations: ["orphan_1"],
      staleOwnershipClaims: ["claim_1"],
      unresolvedDisputes: [],
      unstableDependencies: ["redis"],
      evidence: ["event_1"],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(signals.divergenceScore).toBeGreaterThan(0.7);
    expect(signals.replayDivergenceRisk).toBeGreaterThan(0.6);
  });
});
