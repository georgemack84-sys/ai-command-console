import { describe, expect, it } from "vitest";

import { analyzeRuntimeDrift } from "@/services/convergence/runtimeDriftAnalysis";

describe("analyzeRuntimeDrift", () => {
  it("raises drift under replay and survivability degradation", () => {
    const result = analyzeRuntimeDrift({
      degradationRate: 0.7,
      replayInstabilityScore: 0.8,
      escalationPressure: 0.6,
      dependencyInstabilityScore: 0.5,
      orphanedOperationCount: 3,
      survivabilityScore: 0.2,
      disputed: true,
    });

    expect(result.driftVelocity).toBeGreaterThan(0.5);
  });
});
