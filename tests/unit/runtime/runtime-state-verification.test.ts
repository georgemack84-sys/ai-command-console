import { describe, expect, it } from "vitest";

import { verifyRuntimeState } from "../../../services/runtime/verification/runtimeStateVerification";

describe("runtime state verification", () => {
  it("fails when replay and snapshot truth diverge", () => {
    const result = verifyRuntimeState({
      continuitySnapshots: [
        {
          snapshotId: "snapshot-1",
          runtimeState: "HEALTHY",
          activeExecutions: 1,
          degradedDependencies: [],
          staleLocks: 0,
          recoveryInProgress: false,
          continuityRiskScore: 10,
          survivabilityScore: 90,
          replayDivergenceDetected: false,
          workerAvailabilityScore: 95,
          dependencyStabilityScore: 96,
          timestamp: "2026-05-08T12:00:00.000Z",
        },
      ],
      replayResult: {
        deterministic: false,
        reconstructedStates: ["failed"],
        replaySequence: ["execution.failed"],
      },
      ledgerEvents: [{ sequence: 1, eventType: "execution.failed" }],
      checkpointState: "completed",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUNTIME_STATE_VERIFICATION_FAILED");
    }
  });
});
