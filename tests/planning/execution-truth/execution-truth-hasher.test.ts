import { describe, expect, it } from "vitest";

import { hashExecutionTruth, scoreRiskDeterministically } from "@/services/planning/execution-truth";

describe("execution truth hasher", () => {
  it("produces stable hashes regardless of field ordering", () => {
    const riskProfile = scoreRiskDeterministically([
      {
        stepId: "safe-step",
        destructive: false,
        externalSideEffect: false,
        idempotent: true,
        targetEnvironment: "local",
        rollbackCapability: "full",
        autonomySensitivity: "safe",
        terminalBranch: false,
        failureBranch: false,
        rollbackBranch: false,
        source: "normalized_step_inputs",
      },
    ]);

    const first = hashExecutionTruth({
      dependencyGraphFingerprint: "abc",
      riskProfile,
      governanceEnvelope: { allowed: true, requiredApprovals: [], blockedReasons: [], escalationRequired: false },
      autonomyEnvelope: { maxAutonomyLevel: "bounded_autonomous", downgradeReasons: [] },
      replayEnvelope: { replayable: true, sourceFingerprint: "abc", replayHash: "xyz" },
    });
    const second = hashExecutionTruth({
      replayEnvelope: { replayHash: "xyz", sourceFingerprint: "abc", replayable: true },
      autonomyEnvelope: { downgradeReasons: [], maxAutonomyLevel: "bounded_autonomous" },
      governanceEnvelope: { blockedReasons: [], escalationRequired: false, requiredApprovals: [], allowed: true },
      riskProfile,
      dependencyGraphFingerprint: "abc",
    });

    expect(first).toBe(second);
  });
});
