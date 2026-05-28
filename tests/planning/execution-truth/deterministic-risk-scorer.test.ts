import { describe, expect, it } from "vitest";

import { RISK_WEIGHTS, scoreRiskDeterministically } from "@/services/planning/execution-truth";

describe("deterministic risk scorer", () => {
  it("escalates external side effects without idempotency and unknown environments", () => {
    const profile = scoreRiskDeterministically([
      {
        stepId: "step-x",
        destructive: false,
        externalSideEffect: true,
        idempotent: false,
        targetEnvironment: "unknown",
        rollbackCapability: "unknown",
        autonomySensitivity: "unknown",
        terminalBranch: false,
        failureBranch: false,
        rollbackBranch: false,
        source: "normalized_step_inputs",
      },
    ]);

    expect(profile.overallRisk).not.toBe("R0_SAFE");
    expect(profile.failClosed).toBe(true);
    expect(RISK_WEIGHTS.externalSideEffect).toBeGreaterThan(0);
  });
});
