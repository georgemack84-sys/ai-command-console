import { describe, expect, it } from "vitest";

import { detectReplayDivergence } from "../../../services/replay/divergence/replayDivergenceDetector";

describe("replay divergence detector", () => {
  it("detects state divergence and requires escalation", () => {
    const divergences = detectReplayDivergence({
      replayState: {
        runtimeState: "failed",
        outputHash: "hash-replay",
      },
      historicalState: {
        runtimeState: "completed",
        outputHash: "hash-history",
      },
      replaySequence: ["execution.started", "execution.failed"],
      historicalSequence: ["execution.started", "execution.completed"],
      governanceApproved: false,
      expectedGovernanceApproved: true,
    });

    expect(divergences.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["STATE_DIVERGENCE", "OUTPUT_DIVERGENCE", "TIMELINE_DIVERGENCE", "GOVERNANCE_DIVERGENCE"]),
    );
    expect(divergences.some((entry) => entry.requiresEscalation)).toBe(true);
  });
});
