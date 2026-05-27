import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";

describe("recommendationPrioritizationEngine", () => {
  it("produces deterministic visibility-only priorities for valid inputs", () => {
    const fixture = buildRecommendationPrioritizationFixture();

    expect(fixture.result.result.status).toBe("COMPLETED");
    expect(fixture.result.result.priorities).toHaveLength(1);
    expect(fixture.result.result.priorities[0]?.executionAuthorized).toBe(false);
    expect(fixture.result.result.priorities[0]?.operatorReviewRequired).toBe(true);
  });

  it("rejects invalid execution flags", () => {
    const fixture = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          runtimeMutationAllowed: true as never,
        },
      ]),
    });

    expect(fixture.result.errors.some((error) => error.code === "PRIORITIZATION_INVALID_AUTHORITY_FLAGS")).toBe(true);
    expect(fixture.result.result.status).toBe("FAILED_CLOSED");
  });

  it("lets governance severity increase visibility without changing authority", () => {
    const base = buildRecommendationPrioritizationFixture().result.result.priorities[0]!;
    const elevated = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          governanceSeverity: "CRITICAL",
        },
      ]),
    }).result.result.priorities[0]!;

    expect(elevated.priorityScore).toBeGreaterThan(base.priorityScore);
    expect(elevated.authorityChanged).toBe(false);
  });
});
