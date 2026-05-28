import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";

describe("constitutional replay stability adversarial", () => {
  it("invalidates synthetic replay injection", () => {
    const fixture = buildConstitutionalReplayStabilityFixture({
      metadata: Object.freeze({ syntheticReplayInjection: true, inferredReplayGeneration: true }),
    });

    expect(fixture.result.record.classification).toBe("INVALID");
  });
});
