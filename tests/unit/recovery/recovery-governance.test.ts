import { describe, expect, it } from "vitest";

import { evaluateRecoveryGovernance } from "../../../services/recovery/governance/recoveryGovernance";

describe("recovery governance", () => {
  it("requires approval for destructive recovery actions", () => {
    const result = evaluateRecoveryGovernance({
      action: "terminate",
      replayVerified: true,
      verificationDisputed: false,
      approvalState: "missing",
      conflictingActions: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RECOVERY_APPROVAL_REQUIRED");
    }
  });

  it("blocks mutation while verification remains disputed", () => {
    const result = evaluateRecoveryGovernance({
      action: "rollback",
      replayVerified: false,
      verificationDisputed: true,
      approvalState: "approved",
      conflictingActions: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RECOVERY_VERIFICATION_UNRESOLVED");
    }
  });
});
