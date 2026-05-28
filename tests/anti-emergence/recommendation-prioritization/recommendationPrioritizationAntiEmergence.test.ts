import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";

describe("recommendation prioritization anti-emergence", () => {
  it("prevents priority from becoming approval or permission", () => {
    const fixture = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          approvalDependencyState: "UNKNOWN",
          confidenceLevel: "authorize-now",
        },
      ]),
    });

    expect(fixture.result.errors.some((error) => error.code === "PRIORITIZATION_AUTHORITY_EXPANSION")).toBe(true);
    expect(fixture.result.result.status).toBe("FAILED_CLOSED");
  });
});
