import { buildImmutableRecommendationLedgerFixture } from "@/tests/integration/immutable-recommendation-ledger/helpers";

describe("immutable recommendation ledger replay", () => {
  it("uses original replay snapshots and evidence references only", () => {
    const fixture = buildImmutableRecommendationLedgerFixture();

    expect(fixture.result.events.every((event) =>
      event.replaySnapshotId === fixture.input.replayInput.recommendationPrioritizationInput.inputs[0]!.replaySnapshotId,
    )).toBe(true);
  });
});
