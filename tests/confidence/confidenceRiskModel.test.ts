import { describe, expect, it } from "vitest";
import { buildConfidenceRiskProfile } from "@/services/confidence/confidenceRiskModel";

describe("confidence risk model", () => {
  it("persists deterministic risk profiles", () => {
    const profile = buildConfidenceRiskProfile({
      coordinationId: "coord-1",
      confidenceScore: 0.4,
      replayIntegrityScore: 1,
      governanceAlignmentScore: 0.5,
      approvalClarityScore: 0.25,
      driftRiskScore: 0.5,
      escalationState: "review",
      frozen: false,
      paused: false,
      createdAt: "2026-05-17T07:00:00.000Z",
    });
    expect(profile.uncertaintyScore).toBe(0.6);
  });
});
