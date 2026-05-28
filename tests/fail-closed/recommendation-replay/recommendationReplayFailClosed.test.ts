import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

describe("recommendation replay fail-closed", () => {
  it("fails closed on missing lineage", () => {
    const fixture = buildRecommendationReplayFixture({
      confidenceScoringResult: Object.freeze({
        ...buildRecommendationReplayFixture().input.confidenceScoringResult,
        confidenceScores: Object.freeze([]),
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });

  it("fails closed on missing evidence", () => {
    const fixture = buildRecommendationReplayFixture({
      evidenceAggregationResult: Object.freeze({
        ...buildRecommendationReplayFixture().input.evidenceAggregationResult,
        evidenceReferences: Object.freeze([]),
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
