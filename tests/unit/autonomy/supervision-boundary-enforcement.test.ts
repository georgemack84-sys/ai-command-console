import { describe, expect, it } from "vitest";

import { evaluateAutonomousSupervision } from "@/services/autonomy/autonomousSupervision";

describe("supervision boundary enforcement", () => {
  it("blocks supervision during emergency containment", () => {
    const result = evaluateAutonomousSupervision({
      governanceAllowed: true,
      approvalVerified: true,
      operatorOverrideAttempted: false,
      actionCategory: "routine",
      immutableEvidenceMutationAttempted: false,
      unboundedAutonomyRequested: false,
      emergencyContainmentActive: true,
      sovereigntyState: "EMERGENCY_CONTAINMENT",
      coordinationRisk: 0.9,
      escalationRequired: true,
      disputedTruthPresent: false,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.supervisionState).toBe("BLOCKED");
    expect(result.supervisedExecutionAllowed).toBe(false);
  });
});
