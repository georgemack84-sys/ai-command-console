import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

describe("recommendation replay integration", () => {
  it("uses upstream immutable artifacts without recomputing new intelligence", () => {
    const fixture = buildRecommendationReplayFixture();
    const episode = fixture.result.episodes[0]!;

    expect(episode.lineage.synthesisEpisodeId).toBe(fixture.input.recommendationSynthesisInput.synthesisId);
    expect(episode.confidenceReplay.confidenceScore).toBe(fixture.input.confidenceScoringResult.confidenceScores[0]!.overallConfidence);
  });

  it("records append-only replay audit entries", () => {
    const first = buildRecommendationReplayFixture();
    const second = buildRecommendationReplayFixture({
      existingAuditLedger: first.result.auditLedger,
    });

    expect(second.result.auditLedger.length).toBeGreaterThan(first.result.auditLedger.length);
    expect(second.result.auditLedger[1]?.previousHash).toBe(first.result.auditLedger[0]?.entryHash);
  });
});
