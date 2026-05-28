import { describe, expect, it } from "vitest";

import { validateEscalationSurvivability } from "@/services/validation/escalationSurvivabilityValidation";

describe("validateEscalationSurvivability", () => {
  it("freezes conflicting escalation loops and preserves visibility", () => {
    const result = validateEscalationSurvivability({
      escalationCoordination: {
        frozen: true,
        blocked: false,
        conflictingEscalations: ["esc_2"],
        escalationLineageId: "lineage_1",
        requiresOperatorVisibility: true,
      },
      loopDetected: true,
    });

    expect(result.valid).toBe(false);
    expect(result.freezeActivated).toBe(true);
    expect(result.operatorVisible).toBe(true);
    expect(result.blockedReasons).toContain("escalation_loop_detected");
    expect(result.blockedReasons).toContain("escalation_conflict_detected");
  });
});
