import { describe, expect, it } from "vitest";

import { validateExecutionSafetyTransition } from "@/services/planning/execution-safety";

describe("execution safety state machine", () => {
  it("blocks FROZEN to SAFE without governance clearance", () => {
    const result = validateExecutionSafetyTransition("FROZEN", "SAFE", {
      governanceCleared: false,
      replayValidated: true,
      approvalCleared: false,
    });

    expect(result.ok).toBe(false);
  });
});
