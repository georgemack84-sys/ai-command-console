import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";

describe("recommendation prioritization integration", () => {
  it("consumes confidence scoring output without mutating it", () => {
    const fixture = buildRecommendationPrioritizationFixture();
    const confidenceScore = fixture.confidenceFixture.result.confidenceScores[0]!;
    const replayBound = fixture.result.replayRecords[0]!;

    expect(replayBound.confidenceScoreId).toBe(confidenceScore.confidenceId);
    expect(fixture.confidenceFixture.result.confidenceScores[0]?.overallConfidence).toBe(confidenceScore.overallConfidence);
  });

  it("freezes prioritization when confidence is frozen upstream", () => {
    const fixture = buildRecommendationPrioritizationFixture({
      inputs: Object.freeze([
        {
          ...buildRecommendationPrioritizationFixture().input.inputs[0]!,
          upstreamFrozen: true,
        },
      ]),
    });

    expect(fixture.result.result.status).toBe("FROZEN");
    expect(fixture.result.result.frozenRecommendationIds).toContain(fixture.input.inputs[0]!.recommendationId);
  });

  it("keeps audit records append-only", () => {
    const first = buildRecommendationPrioritizationFixture();
    const second = buildRecommendationPrioritizationFixture({
      existingAuditLedger: first.result.auditLedger,
    });

    expect(second.result.auditLedger.length).toBeGreaterThan(first.result.auditLedger.length);
    expect(second.result.auditLedger[1]?.previousHash).toBe(first.result.auditLedger[0]?.entryHash);
  });
});
