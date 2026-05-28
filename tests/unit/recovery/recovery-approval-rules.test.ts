import { describe, expect, it } from "vitest";

import { getRequiredRecoveryApproval } from "../../../services/recovery/governance/recoveryApprovalRules";

describe("recovery approval rules", () => {
  it("requires destructive approvals for terminate", () => {
    const result = getRequiredRecoveryApproval("terminate");
    expect(result.required).toBe(true);
    expect(result.level).toBe("administrative");
  });

  it("does not require approval for pure replay verification", () => {
    const result = getRequiredRecoveryApproval("replay");
    expect(result.required).toBe(false);
  });
});
