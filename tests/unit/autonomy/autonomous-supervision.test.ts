import { describe, expect, it } from "vitest";

import { evaluateAutonomousSupervision } from "@/services/autonomy/autonomousSupervision";

describe("evaluateAutonomousSupervision", () => {
  it("can recommend stabilization without authorizing execution", () => {
    const result = evaluateAutonomousSupervision({
      governanceAllowed: true,
      approvalVerified: true,
      operatorOverrideAttempted: false,
      actionCategory: "routine",
      immutableEvidenceMutationAttempted: false,
      unboundedAutonomyRequested: false,
      emergencyContainmentActive: false,
      sovereigntyState: "SURVIVABILITY_RISK",
      coordinationRisk: 0.58,
      escalationRequired: true,
      disputedTruthPresent: false,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.stabilizationRecommended).toBe(true);
    expect(result.supervisedExecutionAllowed).toBe(true);
  });
});
