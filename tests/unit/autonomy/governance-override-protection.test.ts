import { describe, expect, it } from "vitest";

import { evaluateAutonomousSupervision } from "@/services/autonomy/autonomousSupervision";

describe("governance override protection", () => {
  it("does not allow autonomy to override operators or governance", () => {
    const result = evaluateAutonomousSupervision({
      governanceAllowed: false,
      approvalVerified: false,
      operatorOverrideAttempted: true,
      actionCategory: "destructive",
      immutableEvidenceMutationAttempted: false,
      unboundedAutonomyRequested: true,
      emergencyContainmentActive: false,
      sovereigntyState: "UNSTABLE",
      coordinationRisk: 0.66,
      escalationRequired: true,
      disputedTruthPresent: false,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.supervisedExecutionAllowed).toBe(false);
    expect(result.blockedReasons).toContain("operator_override_blocked");
    expect(result.blockedReasons).toContain("governance_bypass_blocked");
  });
});
