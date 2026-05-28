import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";

describe("recommendation prioritization adversarial", () => {
  it("fails closed on scheduler and orchestration references", () => {
    const fixture = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          confidenceLevel: "schedule execute call queue",
        },
      ]),
    });

    expect(fixture.result.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) =>
      error.code === "PRIORITIZATION_SCHEDULER_REFERENCE"
      || error.code === "PRIORITIZATION_ORCHESTRATION_REFERENCE"
      || error.code === "PRIORITIZATION_HIDDEN_EXECUTION")).toBe(true);
  });
});
