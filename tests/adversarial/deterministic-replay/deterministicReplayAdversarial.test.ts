import { describe, expect, it } from "vitest";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";

describe("deterministic replay adversarial", () => {
  it("blocks suppression bypass attempts", () => {
    const fixture = buildDeterministicReplayFixture({
      metadata: Object.freeze({ suppressionBypass: true }),
    });
    expect(fixture.result.result.replayCertified).toBe(false);
    expect(fixture.result.errors.some((error) => error.code === "DETERMINISTIC_REPLAY_SUPPRESSION_BYPASS"))
      .toBe(true);
  });
});
