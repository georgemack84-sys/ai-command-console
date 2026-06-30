import { describe, expect, it } from "vitest";
import {
  assertObservationMutationBlocked,
  createMockOwnershipRecord,
  createMockRawMarketObservation,
  createMockSourceReference,
  createMockValidationRecord,
  createRawObservationStore,
  rejectTransformedRawPayload,
  validateRawMarketObservation,
  type RawMarketObservation,
} from "@/src/modules/observations";

function completeStore() {
  const store = createRawObservationStore();
  store.appendRawObservation(createMockRawMarketObservation());
  store.appendOwnershipRecord(createMockOwnershipRecord());
  store.appendSourceReference(createMockSourceReference(), "observation_1");
  store.appendValidationRecord(createMockValidationRecord());
  return store;
}

function rawWith(field: string, value: unknown) {
  return {
    ...createMockRawMarketObservation(),
    [field]: value,
  } as Partial<RawMarketObservation> & Record<string, unknown>;
}

function expectRawRejected(field: string, value: unknown, reason: string) {
  expect(validateRawMarketObservation(rawWith(field, value))).toMatchObject({
    status: "REJECTED",
    reasons: expect.arrayContaining([reason]),
  });
}

describe("EdgeBook Phase 1.4 raw observation store", () => {
  it("appends raw observations successfully", () => {
    expect(createRawObservationStore().appendRawObservation(createMockRawMarketObservation())).toMatchObject({
      status: "APPENDED",
    });
  });

  it("appends ownership records successfully", () => {
    const store = createRawObservationStore();
    store.appendRawObservation(createMockRawMarketObservation());
    expect(store.appendOwnershipRecord(createMockOwnershipRecord())).toMatchObject({ status: "APPENDED" });
  });

  it("appends source references successfully", () => {
    const store = createRawObservationStore();
    store.appendRawObservation(createMockRawMarketObservation());
    expect(store.appendSourceReference(createMockSourceReference(), "observation_1")).toMatchObject({ status: "APPENDED" });
  });

  it("appends validation records successfully", () => {
    const store = createRawObservationStore();
    store.appendRawObservation(createMockRawMarketObservation());
    expect(store.appendValidationRecord(createMockValidationRecord())).toMatchObject({ status: "APPENDED" });
  });

  it("preserves raw payload exactly", () => {
    const rawPayload = { provider: "mock", nested: { line: "-4.5" }, values: [1, 2, 3] };
    const store = createRawObservationStore();

    store.appendRawObservation(createMockRawMarketObservation({ raw_payload: rawPayload }));

    expect(store.getObservationById("observation_1")?.raw_payload).toEqual(rawPayload);
  });

  it("rejects missing observation_id", () => {
    expectRawRejected("observation_id", "", "observation_id is required");
  });

  it("rejects missing market_id", () => {
    expectRawRejected("market_id", "", "market_id is required");
  });

  it("rejects missing source_id", () => {
    expectRawRejected("source_id", "", "source_id is required");
  });

  it("rejects missing ownership_hash", () => {
    expectRawRejected("ownership_hash", "", "ownership_hash is required");
  });

  it("rejects missing raw_payload", () => {
    expectRawRejected("raw_payload", undefined, "raw_payload is required");
  });

  it("rejects missing received_at", () => {
    expectRawRejected("received_at", "", "received_at is required");
  });

  it("rejects missing schema_version", () => {
    expectRawRejected("schema_version", "", "schema_version is required");
  });

  it("rejects missing storage_version", () => {
    expectRawRejected("storage_version", "", "storage_version is required");
  });

  it("fails replay when ownership record is missing", () => {
    const store = createRawObservationStore();
    store.appendRawObservation(createMockRawMarketObservation());
    store.appendSourceReference(createMockSourceReference(), "observation_1");
    store.appendValidationRecord(createMockValidationRecord());

    expect(store.replayObservation("observation_1")).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["ownership record is missing"]),
    });
  });

  it("fails replay when source reference is missing", () => {
    const store = createRawObservationStore();
    store.appendRawObservation(createMockRawMarketObservation());
    store.appendOwnershipRecord(createMockOwnershipRecord());
    store.appendValidationRecord(createMockValidationRecord());

    expect(store.replayObservation("observation_1")).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["source reference is missing"]),
    });
  });

  it("fails replay when validation record is missing", () => {
    const store = createRawObservationStore();
    store.appendRawObservation(createMockRawMarketObservation());
    store.appendOwnershipRecord(createMockOwnershipRecord());
    store.appendSourceReference(createMockSourceReference(), "observation_1");

    expect(store.replayObservation("observation_1")).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["validation record is missing"]),
    });
  });

  it("rejects ownership record mismatch", () => {
    const store = createRawObservationStore();
    store.appendRawObservation(createMockRawMarketObservation());

    expect(store.appendOwnershipRecord(createMockOwnershipRecord({ market_id: "market_2" }))).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["market_id must match observation market_id"]),
    });
  });

  it("rejects source reference mismatch", () => {
    const store = createRawObservationStore();
    store.appendRawObservation(createMockRawMarketObservation());

    expect(store.appendSourceReference(createMockSourceReference({ source_id: "source_2" }), "observation_1")).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["source_id must match observation source_id"]),
    });
  });

  it("rejects validation record mismatch", () => {
    const store = createRawObservationStore();
    store.appendRawObservation(createMockRawMarketObservation());

    expect(store.appendValidationRecord(createMockValidationRecord({ observation_id: "observation_2" }))).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["raw observation is missing"]),
    });
  });

  it("reads observation by id", () => {
    expect(completeStore().getObservationById("observation_1")).toMatchObject({ observation_id: "observation_1" });
  });

  it("lists observation history", () => {
    expect(completeStore().getObservationHistory()).toHaveLength(1);
  });

  it("lists observations by market", () => {
    expect(completeStore().listObservationsByMarket("market_1")).toHaveLength(1);
  });

  it("lists observations by source", () => {
    expect(completeStore().listObservationsBySource("source_1")).toHaveLength(1);
  });

  it("replays full observation state", () => {
    const replay = completeStore().replayObservation("observation_1");

    expect(replay).toMatchObject({
      status: "REPLAYED",
      replay: {
        raw_market_observation: { observation_id: "observation_1" },
        ownership_record: { observation_id: "observation_1" },
        source_reference: { source_id: "source_1" },
        validation_record: { observation_id: "observation_1" },
        schema_version: "1.2.0",
        storage_version: "1.4",
      },
    });
  });

  it("keeps replay read-only from caller mutation", () => {
    const store = completeStore();
    const replay = store.replayObservation("observation_1");
    if (replay.status !== "REPLAYED") throw new Error("expected replay");

    replay.replay.raw_market_observation.market_id = "mutated";

    expect(store.replayObservation("observation_1")).toMatchObject({
      status: "REPLAYED",
      replay: { raw_market_observation: { market_id: "market_1" } },
    });
  });

  it("emits append-only storage events", () => {
    const store = completeStore();

    expect(store.listEvents().map((event) => event.event_type)).toEqual(
      expect.arrayContaining([
        "RAW_OBSERVATION_APPENDED",
        "RAW_PAYLOAD_PRESERVED",
        "OWNERSHIP_RECORD_APPENDED",
        "SOURCE_REFERENCE_APPENDED",
        "VALIDATION_RECORD_APPENDED",
      ]),
    );
  });
});

describe("EdgeBook Phase 1.4 storage boundaries", () => {
  for (const action of [
    "UPDATE_RAW_OBSERVATION",
    "DELETE_RAW_OBSERVATION",
    "REPLACE_RAW_PAYLOAD",
    "UPDATE_OWNERSHIP_RECORD",
    "UPDATE_SOURCE_REFERENCE",
    "UPDATE_VALIDATION_RECORD",
    "REWRITE_VALIDATION_RESULT",
    "REWRITE_STORAGE_HISTORY",
  ] as const) {
    it(`blocks ${action}`, () => {
      expect(() => assertObservationMutationBlocked(action)).toThrow("blocked by the append-only observation store");
    });
  }

  it("rejects transformed data replacing raw payload", () => {
    expect(rejectTransformedRawPayload({ raw_payload: { raw: true }, replacement_payload: { normalized: true } })).toEqual({
      status: "REJECTED",
      reason: "Transformed data cannot replace raw_payload.",
    });
  });

  it("does not expose update or delete APIs", () => {
    const keys = Object.keys(createRawObservationStore()).join(" ").toLowerCase();

    expect(keys).not.toContain("update");
    expect(keys).not.toContain("delete");
    expect(keys).not.toContain("replace");
  });

  it("does not expose recommendation, prediction, edge scoring, or wager logic", async () => {
    const moduleExports = await import("@/src/modules/observations");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("prediction");
    expect(exportedNames).not.toContain("edgescore");
    expect(exportedNames).not.toContain("wager");
  });
});
