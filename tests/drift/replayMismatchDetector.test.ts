import { describe, expect, it } from "vitest";
import { detectReplayMismatch } from "@/services/drift/replayMismatchDetector";

describe("replay mismatch detector", () => {
  it("quarantines unsafe replay continuity", () => {
    const result = detectReplayMismatch({
      proposalId: "proposal-a",
      replayValid: false,
      lifecycleReplayHash: "left",
      proposalReplayHash: "right",
      createdAt: "2026-05-17T06:10:00.000Z",
    });
    expect(result.replayIntegrity).toBe("quarantined");
    expect(result.drifts[0]?.freezeRequired).toBe(true);
  });
});
