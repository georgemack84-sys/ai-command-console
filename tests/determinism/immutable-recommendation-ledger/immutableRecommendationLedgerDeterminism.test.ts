import { buildImmutableRecommendationLedgerFixture } from "@/tests/integration/immutable-recommendation-ledger/helpers";

describe("immutable recommendation ledger determinism", () => {
  it("produces stable ordering, serialization, and hashing", () => {
    const left = buildImmutableRecommendationLedgerFixture();
    const right = buildImmutableRecommendationLedgerFixture();

    expect(left.result.events.map((event) => event.ledgerEventId)).toEqual(right.result.events.map((event) => event.ledgerEventId));
    expect(left.result.events.map((event) => event.serializationHash)).toEqual(right.result.events.map((event) => event.serializationHash));
    expect(left.result.deterministicHash).toBe(right.result.deterministicHash);
  });
});
