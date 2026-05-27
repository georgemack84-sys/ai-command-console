import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

describe("recommendation replay determinism", () => {
  it("produces identical replay output and hash for identical input", () => {
    const left = buildRecommendationReplayFixture();
    const right = buildRecommendationReplayFixture();

    expect(left.result.episodes[0]?.replayHash).toBe(right.result.episodes[0]?.replayHash);
    expect(left.result.deterministicHash).toBe(right.result.deterministicHash);
    expect(left.result.episodes[0]?.evidenceReplay.deterministicOrdering).toEqual(
      right.result.episodes[0]?.evidenceReplay.deterministicOrdering,
    );
  });
});
