import { describe, expect, it } from "vitest";

import { evaluateContinuityConvergence } from "@/services/convergence/continuityConvergenceEngine";

describe("evaluateContinuityConvergence replay divergence", () => {
  it("replay divergence increases divergence score", () => {
    const calm = evaluateContinuityConvergence({
      timestamp: "2026-05-09T00:00:00.000Z",
      continuity: { continuityConfidence: 0.8 },
      stability: { survivabilityScore: 0.8, degradationRate: 0.1, continuityConfidence: 0.8 } as never,
    });
    const divergent = evaluateContinuityConvergence({
      timestamp: "2026-05-09T00:00:00.000Z",
      continuity: { continuityConfidence: 0.8, replayDivergenceDetected: true },
      stability: { survivabilityScore: 0.5, degradationRate: 0.4, replayInstabilityScore: 0.8, continuityConfidence: 0.8 } as never,
    });

    expect(divergent.result.divergenceScore).toBeGreaterThan(calm.result.divergenceScore);
  });
});
