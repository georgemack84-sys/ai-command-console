import { describe, expect, it } from "vitest";
import { revalidateReplayIntegrity } from "@/services/revalidation/replayRevalidationEngine";

describe("replay revalidation engine", () => {
  it("verifies deterministic replay integrity", () => {
    const result = revalidateReplayIntegrity({
      proposalId: "proposal-a",
      replayValid: true,
      lifecycleReplayHash: "replay-a",
      proposalReplayHash: "replay-a",
      lifecycleEntries: 1,
      currentLifecycleState: "approved",
      resultingLifecycleState: "approved",
      correlationEntries: 1,
      lifecycleImmutable: true,
      readinessDerivedOnly: true,
      escalationDerivedOnly: true,
      createdAt: "2026-05-17T06:10:00.000Z",
    });
    expect(result.record.replayIntegrity).toBe("verified");
    expect(result.errors).toEqual([]);
  });

  it("rejects synthetic replay continuity", () => {
    const result = revalidateReplayIntegrity({
      proposalId: "proposal-a",
      replayValid: true,
      lifecycleReplayHash: "replay-a",
      proposalReplayHash: "replay-a",
      lifecycleEntries: 0,
      currentLifecycleState: "approved",
      resultingLifecycleState: "approved",
      correlationEntries: 1,
      lifecycleImmutable: true,
      readinessDerivedOnly: true,
      escalationDerivedOnly: true,
      createdAt: "2026-05-17T06:10:00.000Z",
    });
    expect(result.errors.map((error) => error.code)).toContain("SYNTHETIC_REPLAY_REJECTED");
  });
});
