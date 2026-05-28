import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";

describe("recommendation prioritization replay", () => {
  it("binds to original immutable artifacts", () => {
    const fixture = buildRecommendationPrioritizationFixture();
    const replay = fixture.result.replayRecords[0]!;

    expect(replay.governanceSnapshotId).toBe(fixture.input.inputs[0]!.governanceSnapshotId);
    expect(replay.replaySnapshotId).toBe(fixture.input.inputs[0]!.replaySnapshotId);
    expect(replay.confidenceScoreId).toBe(fixture.input.inputs[0]!.confidenceScoreId);
  });

  it("freezes on replay mismatch", () => {
    const fixture = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          replayIntegrity: "MISMATCH",
        },
      ]),
    });

    expect(fixture.result.result.status).toBe("FROZEN");
  });
});
