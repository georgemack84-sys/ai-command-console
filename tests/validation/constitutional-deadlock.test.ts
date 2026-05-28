import { describe, expect, it } from "vitest";

import { validateGovernanceConflict } from "@/services/validation/governanceConflictValidation";

describe("validateGovernanceConflict", () => {
  it("detects deadlock and preserves fail-closed posture", () => {
    const result = validateGovernanceConflict({
      governanceDeadlock: true,
      freezeConflict: true,
      approvalBypassAttempt: false,
      disputedOperations: ["coordination"],
      immutableAuditVerified: true,
      createdAt: 10,
    });

    expect(result.validationState).toBe("DISPUTED");
    expect(result.constitutionalSafe).toBe(false);
  });
});
