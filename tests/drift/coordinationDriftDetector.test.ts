import { describe, expect, it } from "vitest";
import { detectCoordinationDrift } from "@/services/drift/coordinationDriftDetector";

describe("coordination drift detector", () => {
  it("classifies deterministic drift", () => {
    const result = detectCoordinationDrift({
      proposalId: "proposal-a",
      confidenceScore: 0.4,
      proposalGovernanceHash: "gov-a",
      lifecycleGovernanceHash: "gov-b",
      replayValid: true,
      lifecycleReplayHash: "replay-a",
      proposalReplayHash: "replay-a",
      readinessPolicyView: Object.freeze(["review required"]),
      expectedEnvironmentHash: "env-a",
      observedEnvironmentHash: "env-b",
      createdAt: "2026-05-17T06:10:00.000Z",
    });
    expect(result.report.drifts.length).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });
});
