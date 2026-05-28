import { buildImmutableRecommendationLedgerFixture } from "@/tests/integration/immutable-recommendation-ledger/helpers";

describe("immutable recommendation ledger adversarial", () => {
  it("fails closed on append-only rewrite attempts", () => {
    const first = buildImmutableRecommendationLedgerFixture();
    const fixture = buildImmutableRecommendationLedgerFixture({
      existingEvents: first.result.events,
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
