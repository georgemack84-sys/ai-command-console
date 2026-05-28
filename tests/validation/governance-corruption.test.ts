import { describe, expect, it } from "vitest";

import { validateGovernanceConflict } from "@/services/validation/governanceConflictValidation";

describe("validateGovernanceConflict corruption", () => {
  it("flags governance corruption and immutable audit risk", () => {
    const result = validateGovernanceConflict({
      governanceDeadlock: false,
      freezeConflict: false,
      approvalBypassAttempt: true,
      disputedOperations: [],
      immutableAuditVerified: false,
      createdAt: 10,
    });

    expect(result.failures).toContain("approval_bypass_attempted");
    expect(result.immutableAuditVerified).toBe(false);
  });
});
