import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";

describe("recommendation prioritization fail-closed", () => {
  it("fails closed on missing governance snapshot", () => {
    const fixture = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          governanceSnapshotId: "",
        },
      ]),
    });

    expect(fixture.result.result.status).toBe("FAILED_CLOSED");
  });

  it("fails closed on missing replay snapshot", () => {
    const fixture = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          replaySnapshotId: "",
        },
      ]),
    });

    expect(fixture.result.result.status).toBe("FAILED_CLOSED");
  });
});
