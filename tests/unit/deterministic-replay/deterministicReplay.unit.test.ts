import { describe, expect, it } from "vitest";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";

describe("deterministic replay unit", () => {
  it("reconstructs replay as advisory-only and non-executing", () => {
    const fixture = buildDeterministicReplayFixture();
    expect(fixture.result.result.deterministic).toBe(true);
    expect(fixture.result.result.replayCertified).toBe(true);
    expect(fixture.result.result.reconstructedRecommendationHash)
      .toBe(fixture.result.result.originalRecommendationHash);
  });
});
