import { describe, expect, it } from "vitest";

import { buildExecutiveEscalationAnalysis } from "@/services/executive/executiveEscalationAnalysis";

describe("autonomy supervision", () => {
  it("surfaces emergency autonomy freeze visibility", () => {
    const result = buildExecutiveEscalationAnalysis({
      escalationChain: ["esc-1"],
      escalationRequired: true,
      blockedReasons: ["REPLAY_MISMATCH_UNRESOLVED"],
      supervisionState: "FROZEN",
      escalationPressure: 0.7,
      governanceViolations: [],
    });

    expect(result.emergencyAutonomyFreeze).toBe(true);
    expect(result.constitutionalFreezeVisible).toBe(true);
  });
});
