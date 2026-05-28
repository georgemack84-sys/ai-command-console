import { describe, expect, it } from "vitest";

import { validateRuntimeChaos } from "@/services/validation/runtimeChaosValidation";

describe("validateRuntimeChaos", () => {
  it("escalates replay corruption and containment failure", () => {
    const result = validateRuntimeChaos({
      governanceOutage: false,
      escalationStorm: true,
      dependencyCollapse: true,
      replayCorruption: true,
      containmentFailure: true,
      heartbeatInstability: false,
      createdAt: 10,
    });

    expect(result.validationState).toBe("FAILED");
    expect(result.containmentRequired).toBe(true);
    expect(result.failures).toContain("replay_corruption_detected");
  });
});
