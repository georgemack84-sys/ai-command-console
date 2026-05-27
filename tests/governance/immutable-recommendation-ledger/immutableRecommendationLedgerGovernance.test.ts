import { buildImmutableRecommendationLedgerFixture } from "@/tests/integration/immutable-recommendation-ledger/helpers";

describe("immutable recommendation ledger governance", () => {
  it("freezes on governance mismatch", () => {
    const fixture = buildImmutableRecommendationLedgerFixture({
      replayResult: Object.freeze({
        ...buildImmutableRecommendationLedgerFixture().input.replayResult,
        episodes: Object.freeze([{
          ...buildImmutableRecommendationLedgerFixture().input.replayResult.episodes[0]!,
          governanceReplay: {
            ...buildImmutableRecommendationLedgerFixture().input.replayResult.episodes[0]!.governanceReplay,
            governanceSnapshotId: "governance-drifted",
          },
        }]),
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
  });
});
