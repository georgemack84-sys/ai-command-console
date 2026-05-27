import { describe, expect, it } from "vitest";

import { detectConvergenceDivergence } from "@/services/convergence/divergenceDetection";

describe("detectConvergenceDivergence", () => {
  it("detects replay divergence", () => {
    const result = detectConvergenceDivergence({
      timestamp: "2026-05-09T00:00:00.000Z",
      continuity: { replayDivergenceDetected: true },
      stability: { replayInstabilityScore: 0.8 } as never,
    });

    expect(result.categories).toContain("REPLAY_DIVERGENCE");
  });
});
