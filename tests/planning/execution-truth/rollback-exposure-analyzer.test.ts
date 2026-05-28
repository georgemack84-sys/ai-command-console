import { describe, expect, it } from "vitest";

import { analyzeRollbackExposure, scoreRiskDeterministically } from "@/services/planning/execution-truth";

describe("rollback exposure analyzer", () => {
  it("increases rollback risk for incomplete rollback branches", () => {
    const analyzed = analyzeRollbackExposure(scoreRiskDeterministically([
      {
        stepId: "rollback-step",
        destructive: true,
        externalSideEffect: false,
        idempotent: true,
        targetEnvironment: "staging",
        rollbackCapability: "partial",
        autonomySensitivity: "safe",
        terminalBranch: false,
        failureBranch: false,
        rollbackBranch: true,
        source: "normalized_step_inputs",
      },
    ]));

    expect(analyzed.reasons.some((reason) => reason.includes("rollback exposure"))).toBe(true);
  });
});
