import { describe, expect, it } from "vitest";

import { validateGovernanceConflict } from "@/services/validation/governanceConflictValidation";

describe("governance conflict validation", () => {
  it("surfaces disputed systems and escalation requirement", () => {
    const result = validateGovernanceConflict({
      governanceDeadlock: true,
      freezeConflict: false,
      approvalBypassAttempt: false,
      disputedOperations: ["governance", "containment"],
      immutableAuditVerified: true,
      createdAt: 10,
    });

    expect(result.disputedSystems).toContain("governance");
    expect(result.escalationRequired).toBe(true);
  });
});
