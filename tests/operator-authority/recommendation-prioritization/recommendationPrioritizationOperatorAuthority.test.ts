import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";

describe("recommendation prioritization operator authority", () => {
  it("keeps operator review required and authority unchanged", () => {
    const fixture = buildRecommendationPrioritizationFixture();
    const priority = fixture.result.result.priorities[0]!;

    expect(priority.operatorReviewRequired).toBe(true);
    expect(priority.executionAuthorized).toBe(false);
    expect(priority.authorityChanged).toBe(false);
    expect(priority.scheduledActionCreated).toBe(false);
    expect(priority.runtimeMutationOccurred).toBe(false);
  });
});
