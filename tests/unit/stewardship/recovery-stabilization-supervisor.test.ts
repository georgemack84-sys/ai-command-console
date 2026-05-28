import { describe, expect, it } from "vitest";

import { superviseRecoveryStabilization } from "@/services/stewardship/recoveryStabilizationSupervisor";

describe("superviseRecoveryStabilization", () => {
  it("classifies replay divergence as unstable", () => {
    const result = superviseRecoveryStabilization({
      continuityState: {
        runtimeState: "QUARANTINED",
        continuityConfidence: 0.32,
        recoveryEligible: false,
        recoveryReadiness: 0.21,
        degradedDependencies: ["database"],
        activeExecutions: 1,
        staleLocks: 1,
        replayDivergenceDetected: true,
        dependencyStabilityScore: 0.4,
        workerAvailabilityScore: 0.5,
        survivabilityScore: 0.2,
        updatedAt: "2026-05-09T00:00:00.000Z",
      },
      verification: {
        verificationId: "verification_1",
        executionId: "execution_1",
        status: "DIVERGED",
        reconciliationState: "DIVERGED",
        certificationDecision: "QUARANTINED",
        verified: false,
        disputed: false,
        divergenceDetected: true,
        requiresOperatorReview: false,
        evidence: ["event_1"],
        errors: [],
        warnings: [],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
    });

    expect(result.status).toBe("unstable");
  });
});
