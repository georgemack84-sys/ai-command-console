import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

describe("recommendation replay operator authority", () => {
  it("never authorizes or schedules during replay", () => {
    const fixture = buildRecommendationReplayFixture();
    const episode = fixture.result.episodes[0]!;

    expect(episode.executionAuthorized).toBe(false);
    expect(episode.runtimeMutationOccurred).toBe(false);
    expect(episode.scheduledActionCreated).toBe(false);
    expect(episode.authorityChanged).toBe(false);
    expect(episode.operatorReviewRequired).toBe(true);
  });
});
