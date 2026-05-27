import { describe, expect, it } from "vitest";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";

describe("deterministic replay governance", () => {
  it("fails closed on governance mismatch", () => {
    const fixture = buildDeterministicReplayFixture({
      metadata: Object.freeze({ governanceDrift: true }),
    });
    expect(fixture.result.result.replayCertified).toBe(false);
    expect(fixture.result.errors.some((error) => error.code === "DETERMINISTIC_REPLAY_GOVERNANCE_MISMATCH"))
      .toBe(true);
  });
});
