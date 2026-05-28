import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";

describe("constitutional replay stability anti-emergence", () => {
  it("invalidates hidden replay paths and present-state interpretation", () => {
    const fixture = buildConstitutionalReplayStabilityFixture({
      metadata: Object.freeze({ hiddenReplayPath: true, presentStateInterpretation: true }),
    });

    expect(fixture.result.record.classification).toBe("INVALID");
  });
});
