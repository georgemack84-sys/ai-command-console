import { describe, expect, it } from "vitest";

import { computeDriftAwarePriority } from "@/services/prioritization/driftAwarePrioritization";

describe("computeDriftAwarePriority", () => {
  it("increases containment pressure under drift and replay instability", () => {
    const result = computeDriftAwarePriority({
      convergence: {
        divergenceScore: 0.8,
        state: "DESYNCHRONIZED",
        requiresContainment: true,
      } as never,
      stability: {
        degradationRate: 0.7,
        containmentRecommended: true,
        replayInstabilityScore: 0.8,
      } as never,
    });

    expect(result.runtimeDriftSeverity).toBeGreaterThan(0.7);
    expect(result.containmentPressure).toBeGreaterThan(0.7);
  });
});
