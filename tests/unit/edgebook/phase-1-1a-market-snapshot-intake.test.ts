import { describe, expect, it } from "vitest";
import {
  createSourceRegistryStore,
  registerSourceWithOwnership,
  type SourceRegistryObject,
} from "@/src/modules/sources";
import {
  createMarketSnapshotIntakeLayer,
  type MarketSnapshotInput,
} from "@/src/modules/market-snapshot-intake";

function source(overrides: Partial<SourceRegistryObject> = {}): SourceRegistryObject {
  return {
    source_id: "source_1",
    source_name: "Mock Sportsbook Feed",
    source_type: "SPORTSBOOK",
    trust_level: "HIGH",
    status: "ACTIVE",
    owner_id: "owner_1",
    tenant_id: "tenant_1",
    created_at: "2026-06-04T12:00:00.000Z",
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
    market_type: "TOTAL",
    market_subtype: "GAME_TOTAL",
    participant: null,
    line_value: 221.5,
    odds_value: -110,
    timestamp: "2026-06-04T12:30:00.000Z",
    schema_version: "1.1.0",
    raw_payload_json: {
      bookmaker: "Mock Sportsbook Feed",
      market: "game total",
      line: 221.5,
      price: -110,
    },
    ...overrides,
  };
}

function createReadyLayer(nowIso = "2026-06-04T12:31:00.000Z") {
  const registry = createSourceRegistryStore();
  registerSourceWithOwnership(registry, source());
  return createMarketSnapshotIntakeLayer(registry, { now: () => new Date(nowIso) });
}

describe("EdgeBook Phase 1.1A market snapshot intake", () => {
  it("accepts a registered source and records a replayable snapshot", () => {
    const layer = createReadyLayer();
    const result = layer.intakeSnapshot(snapshot());

    expect(result).toMatchObject({
      status: "ACCEPTED",
      duplicate: false,
      record: {
        status: "SNAPSHOT_READY",
        source_reference: { status: "VALID_SOURCE" },
        previous_snapshot_id: null,
      },
    });
    if (result.status !== "ACCEPTED") throw new Error("expected accepted");
    expect(result.record.snapshot_payload.collected_at).toBe("2026-06-04T12:31:00.000Z");
    expect(result.record.snapshot_payload.participant).toBe("game_total");
  });

  it("generates deterministic market_id and snapshot_id", () => {
    const first = createReadyLayer();
    const second = createReadyLayer();

    const left = first.intakeSnapshot(snapshot());
    const right = second.intakeSnapshot(snapshot());

    if (left.status !== "ACCEPTED" || right.status !== "ACCEPTED") throw new Error("expected accepted");
    expect(left.record.market_id).toBe(right.record.market_id);
    expect(left.record.snapshot_id).toBe(right.record.snapshot_id);
  });

  it("handles duplicate intake idempotently", () => {
    const layer = createReadyLayer();
    const first = layer.intakeSnapshot(snapshot());
    const second = layer.intakeSnapshot(snapshot());

    if (first.status !== "ACCEPTED" || second.status !== "ACCEPTED") throw new Error("expected accepted");
    expect(second.duplicate).toBe(true);
    expect(second.record.snapshot_id).toBe(first.record.snapshot_id);
    expect(layer.listSnapshots()).toHaveLength(1);
  });

  it("normalizes participants deterministically", () => {
    const layer = createReadyLayer();
    const player = layer.intakeSnapshot(snapshot({
      recommendation: undefined as never,
      market_type: "PLAYER_PROP",
      market_subtype: "PLAYER_POINTS",
      participant: "  LeBron   JAMES ",
      player_id: "player_lebron_james",
      player_name: "LeBron James",
      team: "Los Angeles Lakers",
      prop_type: "points",
      line_value: 27.5,
    }));
    if (player.status !== "ACCEPTED") throw new Error("expected accepted");
    expect(player.record.snapshot_payload.participant).toBe("lebron james");
  });

  it("blocks missing, unknown, and disabled sources", () => {
    const missingLayer = createMarketSnapshotIntakeLayer(createSourceRegistryStore(), { now: () => new Date("2026-06-04T12:31:00.000Z") });
    const unknown = missingLayer.intakeSnapshot(snapshot());

    const disabledRegistry = createSourceRegistryStore();
    registerSourceWithOwnership(disabledRegistry, source({ status: "DISABLED", source_id: "source_2" }));
    const disabledLayer = createMarketSnapshotIntakeLayer(disabledRegistry, { now: () => new Date("2026-06-04T12:31:00.000Z") });
    const disabled = disabledLayer.intakeSnapshot(snapshot({ source_id: "source_2" }));

    expect(unknown).toMatchObject({
      status: "REJECTED",
      snapshot_status: "INVALID_SOURCE",
      validation_errors: expect.arrayContaining([expect.objectContaining({ code: "UNKNOWN_SOURCE" })]),
    });
    expect(disabled).toMatchObject({
      status: "REJECTED",
      snapshot_status: "INVALID_SOURCE",
      validation_errors: expect.arrayContaining([expect.objectContaining({ code: "DISABLED_SOURCE" })]),
    });
  });

  it("blocks missing and malformed timestamps while preserving source timestamp when valid", () => {
    const layer = createReadyLayer();
    const missing = layer.intakeSnapshot(snapshot({ timestamp: "" }));
    const malformed = layer.intakeSnapshot(snapshot({ timestamp: "not-a-date" }));
    const valid = layer.intakeSnapshot(snapshot({ timestamp: "2026-06-04T12:40:00.000Z" }));

    expect(missing).toMatchObject({
      status: "REJECTED",
      snapshot_status: "MISSING_TIMESTAMP",
    });
    expect(malformed).toMatchObject({
      status: "REJECTED",
      snapshot_status: "MALFORMED_TIMESTAMP",
    });
    if (valid.status !== "ACCEPTED") throw new Error("expected accepted");
    expect(valid.record.snapshot_payload.timestamp).toBe("2026-06-04T12:40:00.000Z");
  });

  it("finds previous state using source_id and market_id ordering", () => {
    const layer = createReadyLayer("2026-06-04T12:31:00.000Z");
    const first = layer.intakeSnapshot(snapshot({ timestamp: "2026-06-04T12:20:00.000Z" }));
    const second = layer.intakeSnapshot(snapshot({ timestamp: "2026-06-04T12:40:00.000Z" }));
    if (first.status !== "ACCEPTED" || second.status !== "ACCEPTED") throw new Error("expected accepted");
    expect(first.record.previous_snapshot_id).toBeNull();
    expect(second.record.previous_snapshot_id).toBe(first.record.snapshot_id);
  });

  it("does not match previous state across different source or market identity", () => {
    const registry = createSourceRegistryStore();
    registerSourceWithOwnership(registry, source());
    registerSourceWithOwnership(registry, source({ source_id: "source_2", source_name: "Second Feed" }));
    const layer = createMarketSnapshotIntakeLayer(registry, { now: () => new Date("2026-06-04T12:31:00.000Z") });

    const baseline = layer.intakeSnapshot(snapshot());
    const differentSource = layer.intakeSnapshot(snapshot({ source_id: "source_2" }));
    const differentMarket = layer.intakeSnapshot(snapshot({ market_subtype: "FIRST_HALF_TOTAL" }));

    if (baseline.status !== "ACCEPTED" || differentSource.status !== "ACCEPTED" || differentMarket.status !== "ACCEPTED") {
      throw new Error("expected accepted");
    }

    expect(differentSource.record.previous_snapshot_id).toBeNull();
    expect(differentMarket.record.previous_snapshot_id).toBeNull();
  });

  it("preserves raw payload and stores rejection audits", () => {
    const layer = createReadyLayer();
    const accepted = layer.intakeSnapshot(snapshot({ raw_payload_json: { raw: true, nested: { price: -110 } } }));
    const rejected = layer.intakeSnapshot(snapshot({ raw_payload_json: undefined, timestamp: "" }));

    if (accepted.status !== "ACCEPTED") throw new Error("expected accepted");
    expect(accepted.record.raw_payload_json).toEqual({ raw: true, nested: { price: -110 } });
    expect(rejected).toMatchObject({ status: "REJECTED" });
    expect(layer.listValidationAudits()).toHaveLength(1);
    expect(layer.listValidationAudits()[0]).toMatchObject({
      validation_errors: expect.arrayContaining([
        expect.objectContaining({ code: "RAW_PAYLOAD_MISSING" }),
        expect.objectContaining({ code: "MISSING_TIMESTAMP" }),
      ]),
    });
  });

  it("rejects missing recommendation identity requirements and blocks authority-like behavior", () => {
    const layer = createReadyLayer();
    const missingPlayer = layer.intakeSnapshot(snapshot({
      market_type: "PLAYER_PROP",
      market_subtype: "PLAYER_POINTS",
      participant: null,
      player_id: null,
      player_name: null,
      prop_type: null,
      line_value: 27.5,
    }));
    const moneylineWithLine = layer.intakeSnapshot(snapshot({
      market_type: "MONEYLINE",
      market_subtype: "FULL_GAME",
      participant: "home team",
      line_value: -3.5,
    }));

    expect(missingPlayer).toMatchObject({
      status: "REJECTED",
      validation_errors: expect.arrayContaining([expect.objectContaining({ code: "MISSING_MARKET_IDENTITY" })]),
    });
    expect(moneylineWithLine).toMatchObject({
      status: "REJECTED",
      validation_errors: expect.arrayContaining([expect.objectContaining({ code: "SCHEMA_ERROR" })]),
    });
  });

  it("emits observational events only and does not expose recommendation or wagering APIs", async () => {
    const layer = createReadyLayer();
    layer.intakeSnapshot(snapshot());
    const eventTypes = layer.listEvents().map((event) => event.event_type);
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        "SNAPSHOT_RECEIVED",
        "SNAPSHOT_VALIDATED",
        "SNAPSHOT_STORED",
        "SNAPSHOT_READY",
      ]),
    );

    const moduleExports = await import("@/src/modules/market-snapshot-intake");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();
    expect(exportedNames).not.toContain("recommendationengine");
    expect(exportedNames).not.toContain("prioritization");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
  });
});
