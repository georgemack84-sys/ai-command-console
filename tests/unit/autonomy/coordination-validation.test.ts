import { describe, expect, it } from "vitest";

import { validateAutonomousCoordination } from "@/services/autonomy/coordinationValidation";

describe("validateAutonomousCoordination", () => {
  it("freezes on disputed truth and insufficient survivability confidence", () => {
    const result = validateAutonomousCoordination({
      constitutionalSafe: false,
      survivabilityScore: 0.32,
      disputedTruth: true,
      freezeActive: true,
      containmentRequired: true,
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("disputed_truth_freezes_coordination");
    expect(result.blockedReasons).toContain("freeze_state_blocks_coordination");
  });
});
