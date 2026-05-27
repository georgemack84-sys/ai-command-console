import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

describe("recommendation replay governance", () => {
  it("freezes on governance mismatch", () => {
    const fixture = buildRecommendationReplayFixture({
      recommendationSynthesisInput: Object.freeze({
        ...buildRecommendationReplayFixture().input.recommendationSynthesisInput,
        policySnapshotIds: Object.freeze([]),
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
  });
});
