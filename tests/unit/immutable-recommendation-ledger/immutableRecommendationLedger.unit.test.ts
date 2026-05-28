import { buildImmutableRecommendationLedgerFixture } from "@/tests/integration/immutable-recommendation-ledger/helpers";

describe("immutable recommendation ledger", () => {
  it("appends deterministic replay-validated historical events", () => {
    const fixture = buildImmutableRecommendationLedgerFixture();

    expect(fixture.result.status).toBe("COMPLETED");
    expect(fixture.result.events.length).toBeGreaterThan(0);
    expect(fixture.result.events.every((event) => event.metadata.appendOnly && event.metadata.replayCompatible && event.metadata.executable === false)).toBe(true);
  });

  it("preserves non-executing flags", () => {
    const fixture = buildImmutableRecommendationLedgerFixture();
    const audit = fixture.result.auditRecords[0]!;

    expect(audit.executionAuthorized).toBe(false);
    expect(audit.runtimeMutationOccurred).toBe(false);
    expect(audit.scheduledActionCreated).toBe(false);
    expect(audit.authorityChanged).toBe(false);
  });
});
