import { describe, expect, it } from "vitest";

import { correlateConvergenceSignals } from "@/services/convergence/convergenceCorrelation";

describe("correlateConvergenceSignals", () => {
  it("correlates stability and escalation outputs deterministically", () => {
    const input = {
      timestamp: "2026-05-09T00:00:00.000Z",
      continuity: { continuityConfidence: 0.72 },
      stability: { replayInstabilityScore: 0.2, survivabilityScore: 0.7, escalationPressure: 0.3 } as never,
      escalation: { blocked: false, frozen: false } as never,
    };

    expect(correlateConvergenceSignals(input)).toEqual(correlateConvergenceSignals(input));
  });
});
