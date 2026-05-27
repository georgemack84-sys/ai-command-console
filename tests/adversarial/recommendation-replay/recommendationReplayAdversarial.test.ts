import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

describe("recommendation replay adversarial", () => {
  it("fails closed on prioritization failed-closed lineage", () => {
    const fixture = buildRecommendationReplayFixture({
      recommendationPrioritizationResult: Object.freeze({
        ...buildRecommendationReplayFixture().input.recommendationPrioritizationResult,
        result: Object.freeze({
          ...buildRecommendationReplayFixture().input.recommendationPrioritizationResult.result,
          status: "FAILED_CLOSED" as const,
        }),
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
