import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";

describe("constitutional replay stability replay", () => {
  it("fails closed on replay corruption", () => {
    const fixture = buildConstitutionalReplayStabilityFixture({
      metadata: Object.freeze({ replayCorruption: true }),
    });

    expect(["INVALID", "FROZEN", "DISPUTED"]).toContain(fixture.result.record.classification);
  });
});
