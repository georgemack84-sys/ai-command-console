import { describe, expect, it } from "vitest";

import { evaluateRuntimeFreeze } from "@/services/resilience/runtimeFreezeController";

describe("evaluateRuntimeFreeze", () => {
  it("freezes on replay divergence and convergence freeze requirement", () => {
    const result = evaluateRuntimeFreeze({
      stewardship: { shouldFreeze: false },
      continuityConvergence: { requiresFreeze: true, divergenceScore: 0.9 },
      escalationCoordination: { frozen: false },
      replayVerificationState: "DIVERGED",
    } as never);

    expect(result.requiresFreeze).toBe(true);
    expect(result.freezeReasons).toContain("replay_divergence_detected");
  });
});
