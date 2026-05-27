import { describe, expect, it } from "vitest";

import { suppressExecution } from "@/services/enforcement/executionSuppression";

describe("suppressExecution", () => {
  it("distinguishes suppression from execution failure deterministically", () => {
    const result = suppressExecution({
      blockedReasons: ["constitutional_denial_active", "disputed_truth_blocks_execution"],
      containmentApplied: true,
      escalationTriggered: true,
      emergencyLockActive: false,
      executableCandidate: true,
    });

    expect(result.executable).toBe(false);
    expect(result.enforcementState).toBe("DISPUTE_BLOCKED");
  });
});
