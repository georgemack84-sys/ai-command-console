import { describe, expect, it } from "vitest";

import { evaluateExecutiveConstraints } from "@/services/executive/executiveConstraints";

describe("executive containment", () => {
  it("fails closed when containment or disputes are active", () => {
    const result = evaluateExecutiveConstraints({
      deterministicSimulation: true,
      disputedTruthPresent: true,
      containmentRequired: true,
      emergencyLockActive: false,
      blockedReasons: [],
    });

    expect(result.governanceSafe).toBe(false);
    expect(result.blockedReasons).toContain("executive_disputed_truth_present");
  });
});
