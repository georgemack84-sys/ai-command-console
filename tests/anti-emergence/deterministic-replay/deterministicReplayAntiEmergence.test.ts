import { describe, expect, it } from "vitest";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";

describe("deterministic replay anti-emergence", () => {
  it("blocks live registry access attempts", () => {
    const fixture = buildDeterministicReplayFixture({
      metadata: Object.freeze({ liveRegistryAccess: true }),
    });
    expect(fixture.result.result.replayCertified).toBe(false);
    expect(fixture.result.errors.some((error) => error.code === "DETERMINISTIC_REPLAY_LIVE_REGISTRY_ACCESS"))
      .toBe(true);
  });
});
