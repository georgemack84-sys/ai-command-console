import { describe, expect, it } from "vitest";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";

describe("deterministic replay determinism", () => {
  it("reproduces identical scoring and confidence reconstruction", () => {
    const first = buildDeterministicReplayFixture();
    const second = buildDeterministicReplayFixture();
    expect(first.result.scoring.scoringHash).toBe(second.result.scoring.scoringHash);
    expect(first.result.confidence.confidenceHash).toBe(second.result.confidence.confidenceHash);
  });
});
