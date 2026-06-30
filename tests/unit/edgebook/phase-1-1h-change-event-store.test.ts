import { describe, expect, it } from "vitest";
import {
  createChangeEventStore,
  createMarketSnapshotIntakeLayer,
  type ChangeEventStoreInput,
  type MarketSnapshotInput,
  type SnapshotRecord,
} from "@/src/modules/market-snapshot-intake";
import {
  createSourceRegistryStore,
  registerSourceWithOwnership,
  type SourceRegistryObject,
} from "@/src/modules/sources";

function source(overrides: Partial<SourceRegistryObject> = {}): SourceRegistryObject {
  return {
    source_id: "source_1",
    source_name: "Mock Sportsbook Feed",
    source_type: "SPORTSBOOK",
    trust_level: "HIGH",
    status: "ACTIVE",
    owner_id: "owner_1",
    tenant_id: "tenant_1",
    created_at: "2026-06-05T12:00:00.000Z",
    version: "1.1.0",
    ...overrides,
  };
}

function snapshot(overrides: Partial<MarketSnapshotInput> = {}): MarketSnapshotInput {
  return {
    source_id: "source_1",
    sport: "Basketball",
    league: "NBA",
    event_id: "event_1",
    market_type: "SPREAD",
    market_subtype: "FULL_GAME_SPREAD",
    participant: "Boston Celtics",
    line_value: -4.5,
    odds_value: -110,
    timestamp: "2026-06-05T12:30:00.000Z",
    schema_version: "1.1.0",
    raw_payload_json: { market: "spread", line: -4.5, odds: -110 },
    ...overrides,
  };
}

function createSnapshots(first: MarketSnapshotInput, second: MarketSnapshotInput): { previous: SnapshotRecord; current: SnapshotRecord } {
  const registry = createSourceRegistryStore();
  registerSourceWithOwnership(registry, source());
  const layer = createMarketSnapshotIntakeLayer(registry, { now: () => new Date("2026-06-05T12:31:00.000Z") });

  const previous = layer.intakeSnapshot(first);
  const current = layer.intakeSnapshot(second);
  if (previous.status !== "ACCEPTED" || current.status !== "ACCEPTED") throw new Error("expected accepted snapshots");
  return { previous: previous.record, current: current.record };
}

function movementInput(overrides: Partial<ChangeEventStoreInput> = {}): ChangeEventStoreInput {
  return {
    event_type: "SPREAD_MOVEMENT",
    market_id: "market_1",
    source_id: "source_1",
    previous_snapshot_id: "snapshot_prev",
    new_snapshot_id: "snapshot_new",
    previous_value: -4.5,
    new_value: -5.5,
    movement_size: 1,
    movement_direction: "DOWN",
    timestamp: "2026-06-05T12:40:00.000Z",
    detected_at: "2026-06-05T12:40:05.000Z",
    schema_version: "1.1.0",
    payload: {
      spread_effect: "FAVORITE_BECAME_STRONGER",
    },
    ...overrides,
  };
}

describe("EdgeBook Phase 1.1H change event store", () => {
  it("stores supported movement event types and rejects unknown event types", () => {
    const { previous, current } = createSnapshots(
      snapshot({ timestamp: "2026-06-05T12:30:00.000Z" }),
      snapshot({ timestamp: "2026-06-05T12:40:00.000Z", line_value: -5.5 }),
    );
    const store = createChangeEventStore({ now: () => new Date("2026-06-05T12:45:00.000Z") });
    store.registerSnapshots([previous, current]);

    const supportedTypes = [
      "SPREAD_MOVEMENT",
      "TOTALS_MOVEMENT",
      "MONEYLINE_MOVEMENT",
      "PLAYER_PROP_MOVEMENT",
      "ODDS_SHIFT",
    ] as const;
    supportedTypes.forEach((eventType, index) => {
      const result = store.storeEvent(movementInput({
        event_type: eventType,
        market_id: previous.market_id,
        source_id: previous.source_id,
        previous_snapshot_id: previous.snapshot_id,
        new_snapshot_id: current.snapshot_id,
        timestamp: `2026-06-05T12:4${index}:00.000Z`,
        detected_at: `2026-06-05T12:4${index}:05.000Z`,
        payload: { eventType },
      }));
      expect(result).toMatchObject({
        status: "STORED",
        duplicate: false,
        record: { event_type: eventType, created_at: "2026-06-05T12:45:00.000Z" },
      });
    });

    expect(store.storeEvent(movementInput({
      event_type: "UNKNOWN_EVENT",
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
    }))).toEqual({
      status: "REJECTED",
      reason: "EVENT_TYPE_UNKNOWN",
      lifecycle_events: expect.any(Array),
    });
  });

  it("enforces snapshot linkage rules and required source attribution fields", () => {
    const { previous, current } = createSnapshots(
      snapshot({ timestamp: "2026-06-05T12:30:00.000Z" }),
      snapshot({ timestamp: "2026-06-05T12:40:00.000Z", line_value: -5.5 }),
    );
    const store = createChangeEventStore();
    store.registerSnapshot(previous);
    store.registerSnapshot(current);

    expect(store.storeEvent(movementInput({
      previous_snapshot_id: "",
      new_snapshot_id: current.snapshot_id,
    }))).toMatchObject({ status: "REJECTED", reason: "PREVIOUS_SNAPSHOT_ID_MISSING" });
    expect(store.storeEvent(movementInput({
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: "",
    }))).toMatchObject({ status: "REJECTED", reason: "NEW_SNAPSHOT_ID_MISSING" });
    expect(store.storeEvent(movementInput({
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: previous.snapshot_id,
    }))).toMatchObject({ status: "REJECTED", reason: "SNAPSHOT_LINKAGE_INVALID" });
    expect(store.storeEvent(movementInput({
      previous_snapshot_id: "missing_prev",
      new_snapshot_id: "missing_new",
    }))).toMatchObject({ status: "REJECTED", reason: "SNAPSHOT_LINKAGE_INVALID" });
    expect(store.storeEvent(movementInput({
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      source_id: "",
    }))).toMatchObject({ status: "REJECTED", reason: "SOURCE_ID_MISSING" });
    expect(store.storeEvent(movementInput({
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      market_id: "",
    }))).toMatchObject({ status: "REJECTED", reason: "MARKET_ID_MISSING" });
    expect(store.storeEvent(movementInput({
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      timestamp: "",
    }))).toMatchObject({ status: "REJECTED", reason: "TIMESTAMP_MISSING" });
    expect(store.storeEvent(movementInput({
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      detected_at: "",
    }))).toMatchObject({ status: "REJECTED", reason: "DETECTED_AT_MISSING" });
    expect(store.storeEvent(movementInput({
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      schema_version: "" as never,
    }))).toMatchObject({ status: "REJECTED", reason: "SCHEMA_VERSION_MISSING" });
  });

  it("controls duplicates idempotently and creates conflicts for mismatched payload hashes", () => {
    const { previous, current } = createSnapshots(
      snapshot({ timestamp: "2026-06-05T12:30:00.000Z" }),
      snapshot({ timestamp: "2026-06-05T12:40:00.000Z", line_value: -5.5 }),
    );
    const store = createChangeEventStore({ now: () => new Date("2026-06-05T12:45:00.000Z") });
    store.registerSnapshots([previous, current]);
    const baseInput = movementInput({
      market_id: previous.market_id,
      source_id: previous.source_id,
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      payload: { spread_effect: "FAVORITE_BECAME_STRONGER" },
    });

    const first = store.storeEvent(baseInput);
    const duplicate = store.storeEvent(baseInput);
    const conflict = store.storeEvent({
      ...baseInput,
      payload: { spread_effect: "FAVORITE_BECAME_WEAKER" },
    });

    expect(first).toMatchObject({ status: "STORED", duplicate: false });
    expect(duplicate).toMatchObject({ status: "DUPLICATE", duplicate: true });
    expect(conflict).toMatchObject({
      status: "CONFLICT",
      existing_record: { change_event_id: first.status === "STORED" ? first.record.change_event_id : "" },
    });
    expect(store.listChangeEvents()).toHaveLength(1);
    expect(store.listConflicts()).toHaveLength(1);
  });

  it("stores velocity events with linked movement event ids and blocks missing or invalid linkage", () => {
    const { previous, current } = createSnapshots(
      snapshot({ timestamp: "2026-06-05T12:30:00.000Z" }),
      snapshot({ timestamp: "2026-06-05T12:40:00.000Z", line_value: -5.5 }),
    );
    const store = createChangeEventStore();
    store.registerSnapshots([previous, current]);

    const movement = store.storeEvent(movementInput({
      event_type: "ODDS_SHIFT",
      market_id: previous.market_id,
      source_id: previous.source_id,
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      payload: { price_only: true, silent_market_pressure: true },
    }));
    if (movement.status !== "STORED") throw new Error("expected stored movement event");

    expect(store.storeEvent({
      event_type: "MOVEMENT_VELOCITY",
      market_id: previous.market_id,
      source_id: previous.source_id,
      timestamp: "2026-06-05T12:41:00.000Z",
      detected_at: "2026-06-05T12:41:05.000Z",
      schema_version: "1.1.0",
      payload: {
        event_ids: [movement.record.change_event_id],
        velocity_score: 1.2,
      },
      event_ids: [movement.record.change_event_id],
      first_seen_at: "2026-06-05T12:30:00.000Z",
      last_seen_at: "2026-06-05T12:40:00.000Z",
      movement_count: 2,
      velocity_state: "FAST",
    })).toMatchObject({
      status: "STORED",
      record: { event_type: "MOVEMENT_VELOCITY", velocity_state: "FAST" },
    });

    expect(store.storeEvent({
      event_type: "MOVEMENT_VELOCITY",
      market_id: previous.market_id,
      source_id: previous.source_id,
      timestamp: "2026-06-05T12:42:00.000Z",
      detected_at: "2026-06-05T12:42:05.000Z",
      schema_version: "1.1.0",
      payload: {},
      event_ids: [],
      first_seen_at: "2026-06-05T12:30:00.000Z",
      last_seen_at: "2026-06-05T12:40:00.000Z",
      movement_count: 2,
    })).toMatchObject({ status: "REJECTED", reason: "VELOCITY_EVENT_IDS_MISSING" });

    expect(store.storeEvent({
      event_type: "MOVEMENT_VELOCITY",
      market_id: previous.market_id,
      source_id: previous.source_id,
      timestamp: "2026-06-05T12:43:00.000Z",
      detected_at: "2026-06-05T12:43:05.000Z",
      schema_version: "1.1.0",
      payload: {},
      event_ids: ["missing_change_event"],
      first_seen_at: "2026-06-05T12:30:00.000Z",
      last_seen_at: "2026-06-05T12:40:00.000Z",
      movement_count: 2,
    })).toMatchObject({ status: "REJECTED", reason: "VELOCITY_EVENT_LINKAGE_INVALID" });
  });

  it("stores immutable payloads, supports append-only corrections, and preserves originals", () => {
    const { previous, current } = createSnapshots(
      snapshot({ timestamp: "2026-06-05T12:30:00.000Z" }),
      snapshot({ timestamp: "2026-06-05T12:40:00.000Z", line_value: -5.5 }),
    );
    const store = createChangeEventStore({ now: () => new Date("2026-06-05T12:45:00.000Z") });
    store.registerSnapshots([previous, current]);
    const stored = store.storeEvent(movementInput({
      event_type: "PLAYER_PROP_MOVEMENT",
      market_id: previous.market_id,
      source_id: previous.source_id,
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      payload: {
        player_id: "player_1",
        prop_type: "points",
        availability_status: "AVAILABLE",
      },
    }));
    if (stored.status !== "STORED") throw new Error("expected stored");

    const payloadHash = stored.record.payload_hash;
    const correction = store.storeCorrection({
      corrected_change_event_id: stored.record.change_event_id,
      correction_reason: "manual reconciliation",
      correction_payload: { note: "preserve original" },
    });

    expect(correction).toMatchObject({
      corrected_change_event_id: stored.record.change_event_id,
      correction_reason: "manual reconciliation",
      created_at: "2026-06-05T12:45:00.000Z",
    });
    const listed = store.listChangeEvents();
    listed[0].payload.player_id = "mutated";
    expect(store.listChangeEvents()[0].payload.player_id).toBe("player_1");
    expect(store.listChangeEvents()[0].payload_hash).toBe(payloadHash);
    expect(store.listCorrections()).toHaveLength(1);
  });

  it("replays market and source history deterministically and stays informational only", async () => {
    const { previous, current } = createSnapshots(
      snapshot({ timestamp: "2026-06-05T12:30:00.000Z" }),
      snapshot({ timestamp: "2026-06-05T12:40:00.000Z", line_value: -5.5 }),
    );
    const store = createChangeEventStore();
    store.registerSnapshots([previous, current]);
    store.storeEvent(movementInput({
      event_type: "SPREAD_MOVEMENT",
      market_id: previous.market_id,
      source_id: previous.source_id,
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      timestamp: "2026-06-05T12:41:00.000Z",
      detected_at: "2026-06-05T12:41:06.000Z",
      payload: { spread_effect: "FAVORITE_BECAME_STRONGER" },
    }));
    store.storeEvent(movementInput({
      event_type: "ODDS_SHIFT",
      market_id: previous.market_id,
      source_id: previous.source_id,
      previous_snapshot_id: previous.snapshot_id,
      new_snapshot_id: current.snapshot_id,
      timestamp: "2026-06-05T12:41:00.000Z",
      detected_at: "2026-06-05T12:41:05.000Z",
      payload: { silent_market_pressure: true },
    }));

    const byMarket = store.replayByMarket(previous.market_id);
    const bySource = store.replayBySource(previous.source_id);
    expect(byMarket).toHaveLength(2);
    expect(bySource).toHaveLength(2);
    expect(byMarket[0].detected_at <= byMarket[1].detected_at).toBe(true);

    const moduleExports = await import("@/src/modules/market-snapshot-intake");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();
    expect(exportedNames).toContain("changeeventstore");
    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("confidence");
    expect(exportedNames).not.toContain("guarantee");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
    expect(exportedNames).not.toContain("bet");
  });
});
