import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";

describe("recommendation prioritization determinism", () => {
  it("produces identical score, tier, ordering, and hashes for identical inputs", () => {
    const left = buildRecommendationPrioritizationFixture();
    const right = buildRecommendationPrioritizationFixture();

    expect(left.result.result.priorities[0]?.priorityScore).toBe(right.result.result.priorities[0]?.priorityScore);
    expect(left.result.result.priorities[0]?.priorityTier).toBe(right.result.result.priorities[0]?.priorityTier);
    expect(left.result.result.priorities[0]?.orderingRank).toBe(right.result.result.priorities[0]?.orderingRank);
    expect(left.result.result.priorities[0]?.prioritizationHash).toBe(right.result.result.priorities[0]?.prioritizationHash);
    expect(left.result.result.resultHash).toBe(right.result.result.resultHash);
  });
});
