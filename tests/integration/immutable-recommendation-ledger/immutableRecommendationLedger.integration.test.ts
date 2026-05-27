import { buildImmutableRecommendationLedgerFixture } from "@/tests/integration/immutable-recommendation-ledger/helpers";

describe("immutable recommendation ledger integration", () => {
  it("binds ledger events to replay-validated historical artifacts", () => {
    const fixture = buildImmutableRecommendationLedgerFixture();
    const replayEpisode = fixture.input.replayResult.episodes[0]!;

    expect(fixture.result.events.at(-1)?.eventType).toBe("recommendation.replayed");
    expect(fixture.result.events.at(-1)?.governanceSnapshotId).toBe(replayEpisode.governanceReplay.governanceSnapshotId);
  });

  it("keeps audit append-only", () => {
    const first = buildImmutableRecommendationLedgerFixture();
    const second = buildImmutableRecommendationLedgerFixture({
      existingEvents: first.result.events,
      existingAuditLedger: first.result.auditLedger,
    });

    expect(second.result.auditLedger.length).toBeGreaterThan(first.result.auditLedger.length);
    expect(second.result.auditLedger[1]?.previousHash).toBe(first.result.auditLedger[0]?.entryHash);
  });
});
