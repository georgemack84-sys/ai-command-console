import { describe, expect, it } from "vitest";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";

describe("deterministic replay fail closed", () => {
  it("halts on replay approximation attempts", () => {
    const fixture = buildDeterministicReplayFixture({
      metadata: Object.freeze({ replayApproximation: true }),
    });
    expect(fixture.result.result.replayCertified).toBe(false);
    expect(fixture.result.errors.some((error) => error.code === "DETERMINISTIC_REPLAY_APPROXIMATION"))
      .toBe(true);
  });
});
