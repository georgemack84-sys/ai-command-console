import { describe, expect, it } from "vitest";

import { scoreContainmentEffectiveness } from "@/services/sovereignty/containmentEffectiveness";

describe("scoreContainmentEffectiveness", () => {
  it("detects weak containment without executing containment", () => {
    const result = scoreContainmentEffectiveness({
      activeContainment: true,
      failedContainmentAttempts: 0.7,
      unresolvedInstability: 0.8,
      repeatedRecoveryLoops: 0.65,
      escalationSaturation: 0.74,
      containmentWeakness: 0.8,
    });

    expect(result.weak).toBe(true);
    expect(result.containmentEffectiveness).toBeLessThan(0.5);
  });
});
