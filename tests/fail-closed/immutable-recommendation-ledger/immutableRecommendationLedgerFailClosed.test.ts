import { buildImmutableRecommendationLedgerFixture } from "@/tests/integration/immutable-recommendation-ledger/helpers";

describe("immutable recommendation ledger fail-closed", () => {
  it("fails closed on replay invalidation", () => {
    const fixture = buildImmutableRecommendationLedgerFixture({
      replayResult: Object.freeze({
        ...buildImmutableRecommendationLedgerFixture().input.replayResult,
        status: "FAILED_CLOSED" as const,
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });

  it("fails closed on timestamp mutation", () => {
    const fixture = buildImmutableRecommendationLedgerFixture({
      ledgerTimestamp: "not-a-timestamp",
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
