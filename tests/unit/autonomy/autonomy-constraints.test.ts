import { describe, expect, it } from "vitest";

import { validateAutonomyConstraints } from "@/services/autonomy/autonomyConstraints";

describe("validateAutonomyConstraints", () => {
  it("blocks destructive self-authorization and approval bypass", () => {
    const result = validateAutonomyConstraints({
      actionCategory: "destructive",
      operatorOverrideAttempted: true,
      approvalVerified: false,
      governanceAllowed: false,
      immutableEvidenceMutationAttempted: true,
      unboundedAutonomyRequested: true,
      emergencyContainmentActive: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.blockedReasons).toContain("destructive_self_authorization_blocked");
    expect(result.blockedReasons).toContain("approval_bypass_blocked");
  });
});
