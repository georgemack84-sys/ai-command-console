import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

describe("recommendation replay engine", () => {
  it("reconstructs a replay episode deterministically", () => {
    const fixture = buildRecommendationReplayFixture();

    expect(fixture.result.status).toBe("COMPLETED");
    expect(fixture.result.episodes).toHaveLength(1);
    expect(fixture.result.episodes[0]?.executionAuthorized).toBe(false);
    expect(fixture.result.episodes[0]?.operatorReviewRequired).toBe(true);
  });

  it("keeps replay reconstructive-only", () => {
    const fixture = buildRecommendationReplayFixture();
    const episode = fixture.result.episodes[0]!;

    expect(episode.runtimeMutationOccurred).toBe(false);
    expect(episode.scheduledActionCreated).toBe(false);
    expect(episode.authorityChanged).toBe(false);
  });
});
