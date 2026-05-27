import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";

describe("recommendation prioritization governance", () => {
  it("lets governance severity control visibility", () => {
    const low = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          governanceSeverity: "LOW",
        },
      ]),
    });
    const high = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          governanceSeverity: "CRITICAL",
        },
      ]),
    });

    expect(high.result.result.priorities[0]!.priorityScore).toBeGreaterThan(low.result.result.priorities[0]!.priorityScore);
  });

  it("fails closed on governance ambiguity", () => {
    const fixture = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          governanceSeverity: "CRITICAL",
          validationStatus: "MISSING",
        },
      ]),
    });

    expect(fixture.result.result.status).toBe("FAILED_CLOSED");
  });
});
