import { buildImmutableRecommendationLedgerFixture } from "@/tests/integration/immutable-recommendation-ledger/helpers";

describe("immutable recommendation ledger anti-emergence", () => {
  it("blocks hidden execution metadata", () => {
    const fixture = buildImmutableRecommendationLedgerFixture({
      replayInput: Object.freeze({
        ...buildImmutableRecommendationLedgerFixture().input.replayInput,
        recommendationPrioritizationInput: Object.freeze({
          ...buildImmutableRecommendationLedgerFixture().input.replayInput.recommendationPrioritizationInput,
          metadata: Object.freeze({ executionIntent: "do-it-now" }),
        }),
      }),
    });

    expect(fixture.result.status).not.toBe("COMPLETED");
  });
});
