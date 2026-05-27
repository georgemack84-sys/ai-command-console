import { describe, expect, it } from "vitest";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";

describe("recommendation constraint replay preservation", () => {
  it("keeps replay restrictions bound to original replay artifacts", () => {
    const fixture = buildRecommendationConstraintFixture();
    const replayRecord = fixture.result.replayRecords[0];

    expect(replayRecord?.replayHash).toBe(
      fixture.input.recommendationSynthesisInput.deterministicReplayResult.result.replayHash,
    );
  });
});
