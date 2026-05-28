import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

describe("recommendation replay anti-emergence", () => {
  it("blocks hidden execution or orchestration semantics", () => {
    const fixture = buildRecommendationReplayFixture({
      recommendationConstraintResult: Object.freeze({
        ...buildRecommendationReplayFixture().input.recommendationConstraintResult,
        authorityRecords: Object.freeze([{
          ...buildRecommendationReplayFixture().input.recommendationConstraintResult.authorityRecords[0]!,
          operatorSupremacyPreserved: false,
        }]),
      }),
    });

    expect(fixture.result.status).not.toBe("COMPLETED");
  });
});
