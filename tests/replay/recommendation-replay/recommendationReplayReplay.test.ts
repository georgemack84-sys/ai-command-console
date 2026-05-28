import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

describe("recommendation replay snapshot binding", () => {
  it("ignores latest governance by preserving original snapshots", () => {
    const fixture = buildRecommendationReplayFixture();
    const episode = fixture.result.episodes[0]!;

    expect(episode.governanceReplay.governanceSnapshotId).toBe(
      fixture.input.recommendationPrioritizationInput.inputs[0]!.governanceSnapshotId,
    );
    expect(episode.governanceReplay.policySnapshotId).toBe(
      fixture.input.recommendationSynthesisInput.policySnapshotIds[0],
    );
  });
});
