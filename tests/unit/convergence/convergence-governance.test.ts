import { describe, expect, it } from "vitest";

import { applyConvergencePolicies } from "@/services/convergence/convergencePolicies";

describe("applyConvergencePolicies", () => {
  it("fails closed on disputed continuity", () => {
    const result = applyConvergencePolicies({
      divergenceScore: 0.4,
      replayDivergence: false,
      escalationConflict: false,
      disputed: true,
      systemicRisk: false,
      unstableDependencyPropagation: false,
    });

    expect(result.requiresFreeze).toBe(true);
    expect(result.state).toBe("DISPUTED");
  });
});
