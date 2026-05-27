import { describe, expect, it } from "vitest";
import { detectCoordinationDrift } from "@/services/drift/coordinationDriftDetector";

describe("adversarial drift constraints", () => {
  it("does not restore trust when telemetry stabilizes", () => {
    const result = detectCoordinationDrift({
      proposalId: "proposal-a",
      confidenceScore: 0.95,
      proposalGovernanceHash: "gov-a",
      lifecycleGovernanceHash: "gov-a",
      replayValid: true,
      lifecycleReplayHash: "replay-a",
      proposalReplayHash: "replay-a",
      readinessPolicyView: Object.freeze(["normal"]),
      expectedEnvironmentHash: "env-a",
      observedEnvironmentHash: "env-a",
      createdAt: "2026-05-17T06:10:00.000Z",
    });
    expect(result.confidenceState).toBe("stable");
    expect(result.report.drifts).toEqual([]);
  });
});
