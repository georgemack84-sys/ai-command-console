import { describe, expect, it } from "vitest";

import { buildAutonomyEnvelope, scoreRiskDeterministically } from "@/services/planning/execution-truth";

describe("autonomy envelope builder", () => {
  it("downgrades autonomy for critical sensitivity and high risk", () => {
    const profile = scoreRiskDeterministically([
      {
        stepId: "critical-step",
        destructive: true,
        externalSideEffect: false,
        idempotent: true,
        targetEnvironment: "production",
        rollbackCapability: "full",
        autonomySensitivity: "critical",
        terminalBranch: false,
        failureBranch: false,
        rollbackBranch: false,
        source: "normalized_step_inputs",
      },
    ]);

    const envelope = buildAutonomyEnvelope(profile, {
      allowed: true,
      requiredApprovals: ["production"],
      blockedReasons: [],
      escalationRequired: true,
    });

    expect(["approval_required", "manual_only", "none"]).toContain(envelope.maxAutonomyLevel);
  });
});
