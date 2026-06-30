import { describe, expect, it } from "vitest";
import {
  createMarketSnapshotIntakeLayer,
  createOddsShiftMonitor,
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
    raw_payload_json: {
      bookmaker: "Mock Sportsbook Feed",
      market: "spread",
      line: -4.5,
      price: -110,
    },
    ...overrides,
  };
}

function createSnapshotRecord(
  first: MarketSnapshotInput,
  second: MarketSnapshotInput,
): { previous: SnapshotRecord; current: SnapshotRecord } {
  const registry = createSourceRegistryStore();
  registerSourceWithOwnership(registry, source());
  registerSourceWithOwnership(registry, source({ source_id: "source_2", source_name: "Second Feed" }));
  const layer = createMarketSnapshotIntakeLayer(registry, { now: () => new Date("2026-06-05T12:31:00.000Z") });

  const previous = layer.intakeSnapshot(first);
  if (previous.status !== "ACCEPTED") throw new Error("expected first snapshot accepted");
  const current = layer.intakeSnapshot(second);
  if (current.status !== "ACCEPTED") throw new Error("expected second snapshot accepted");

  return { previous: previous.record, current: current.record };
}

function cloneRecord(record: SnapshotRecord, overrides: Partial<SnapshotRecord> = {}): SnapshotRecord {
  return {
    ...structuredClone(record),
    ...overrides,
  };
}

describe("EdgeBook Phase 1.1F odds shift monitor", () => {
  it("detects odds shifts and classifies compressed and expanded states", () => {
    const monitor = createOddsShiftMonitor({ now: () => new Date("2026-06-05T12:45:00.000Z") });
    const compressedNegative = createSnapshotRecord(
      snapshot({ odds_value: -110 }),
      snapshot({ odds_value: -125, timestamp: "2026-06-05T12:40:00.000Z" }),
    );
    const compressedPositive = createSnapshotRecord(
      snapshot({ participant: "Los Angeles Lakers", odds_value: 120 }),
      snapshot({ participant: "Los Angeles Lakers", odds_value: 105, timestamp: "2026-06-05T12:40:00.000Z" }),
    );
    const expandedNegative = createSnapshotRecord(
      snapshot({ participant: "Miami Heat", odds_value: -135 }),
      snapshot({ participant: "Miami Heat", odds_value: -115, timestamp: "2026-06-05T12:40:00.000Z" }),
    );
    const expandedPositive = createSnapshotRecord(
      snapshot({ participant: "Denver Nuggets", odds_value: 105 }),
      snapshot({ participant: "Denver Nuggets", odds_value: 130, timestamp: "2026-06-05T12:40:00.000Z" }),
    );

    expect(monitor.detectShift(compressedNegative.previous, compressedNegative.current)).toMatchObject({
      status: "RECORDED",
      duplicate: false,
      event: {
        shift_type: "COMPRESSED",
        price_delta: -15,
        detected_at: "2026-06-05T12:45:00.000Z",
      },
    });
    expect(monitor.detectShift(compressedPositive.previous, compressedPositive.current)).toMatchObject({
      status: "RECORDED",
      event: { shift_type: "COMPRESSED", price_delta: -15 },
    });
    expect(monitor.detectShift(expandedNegative.previous, expandedNegative.current)).toMatchObject({
      status: "RECORDED",
      event: { shift_type: "EXPANDED", price_delta: 20 },
    });
    expect(monitor.detectShift(expandedPositive.previous, expandedPositive.current)).toMatchObject({
      status: "RECORDED",
      event: { shift_type: "EXPANDED", price_delta: 25 },
    });
  });

  it("calculates implied probability shifts deterministically", () => {
    const monitor = createOddsShiftMonitor();
    const negative = createSnapshotRecord(
      snapshot({ odds_value: -110 }),
      snapshot({ odds_value: -125, timestamp: "2026-06-05T12:40:00.000Z" }),
    );
    const positive = createSnapshotRecord(
      snapshot({ participant: "Phoenix Suns", odds_value: 120 }),
      snapshot({ participant: "Phoenix Suns", odds_value: 105, timestamp: "2026-06-05T12:40:00.000Z" }),
    );

    expect(monitor.detectShift(negative.previous, negative.current)).toMatchObject({
      status: "RECORDED",
      event: {
        implied_probability_previous: expect.closeTo(0.5238, 4),
        implied_probability_new: expect.closeTo(0.5556, 4),
        implied_probability_delta: expect.closeTo(0.0317, 4),
      },
    });
    expect(monitor.detectShift(positive.previous, positive.current)).toMatchObject({
      status: "RECORDED",
      event: {
        implied_probability_previous: expect.closeTo(0.4545, 4),
        implied_probability_new: expect.closeTo(0.4878, 4),
      },
    });
  });

  it("tracks price-only movement and silent market pressure when the line does not change", () => {
    const monitor = createOddsShiftMonitor();
    const priceOnly = createSnapshotRecord(
      snapshot({ odds_value: -110, line_value: -4.5 }),
      snapshot({ odds_value: -125, line_value: -4.5, timestamp: "2026-06-05T12:40:00.000Z" }),
    );
    const lineAndPrice = createSnapshotRecord(
      snapshot({ participant: "Indiana Pacers", odds_value: 100, line_value: 221.5, market_type: "TOTAL", market_subtype: "GAME_TOTAL" }),
      snapshot({ participant: "Indiana Pacers", odds_value: -115, line_value: 223.5, market_type: "TOTAL", market_subtype: "GAME_TOTAL", timestamp: "2026-06-05T12:40:00.000Z" }),
    );

    expect(monitor.detectShift(priceOnly.previous, priceOnly.current)).toMatchObject({
      status: "RECORDED",
      event: {
        line_changed: false,
        price_only: true,
        silent_market_pressure: true,
      },
    });
    expect(monitor.detectShift(lineAndPrice.previous, lineAndPrice.current)).toMatchObject({
      status: "RECORDED",
      event: {
        line_changed: true,
        price_only: false,
        silent_market_pressure: false,
      },
    });
  });

  it("classifies volatility states deterministically within the configured window", () => {
    const monitor = createOddsShiftMonitor({ windowSeconds: 300 });
    const one = createSnapshotRecord(
      snapshot({ participant: "Market One", timestamp: "2026-06-05T12:30:00.000Z", odds_value: -110 }),
      snapshot({ participant: "Market One", timestamp: "2026-06-05T12:31:00.000Z", odds_value: -115 }),
    );
    const two = createSnapshotRecord(
      snapshot({ participant: "Market One", timestamp: "2026-06-05T12:31:30.000Z", odds_value: -115 }),
      snapshot({ participant: "Market One", timestamp: "2026-06-05T12:32:00.000Z", odds_value: -120 }),
    );
    const three = createSnapshotRecord(
      snapshot({ participant: "Market One", timestamp: "2026-06-05T12:32:30.000Z", odds_value: -120 }),
      snapshot({ participant: "Market One", timestamp: "2026-06-05T12:33:00.000Z", odds_value: -125 }),
    );
    const four = createSnapshotRecord(
      snapshot({ participant: "Market One", timestamp: "2026-06-05T12:33:30.000Z", odds_value: -125 }),
      snapshot({ participant: "Market One", timestamp: "2026-06-05T12:34:00.000Z", odds_value: -130 }),
    );

    expect(monitor.detectShift(one.previous, one.current)).toMatchObject({
      status: "RECORDED",
      event: { volatility_state: "NORMAL" },
    });
    expect(monitor.detectShift(two.previous, two.current)).toMatchObject({
      status: "RECORDED",
      event: { volatility_state: "ELEVATED" },
    });
    expect(monitor.detectShift(three.previous, three.current)).toMatchObject({
      status: "RECORDED",
      event: { volatility_state: "ELEVATED" },
    });
    expect(monitor.detectShift(four.previous, four.current)).toMatchObject({
      status: "RECORDED",
      event: { volatility_state: "VOLATILE" },
    });
  });

  it("returns no movement when odds are unchanged and blocks invalid comparisons", () => {
    const monitor = createOddsShiftMonitor();
    const unchanged = createSnapshotRecord(
      snapshot({ odds_value: -110 }),
      snapshot({ odds_value: -110, timestamp: "2026-06-05T12:40:00.000Z" }),
    );
    const baseline = createSnapshotRecord(
      snapshot({ odds_value: -110 }),
      snapshot({ odds_value: -125, timestamp: "2026-06-05T12:40:00.000Z" }),
    );
    const differentSource = createSnapshotRecord(
      snapshot({ source_id: "source_2", odds_value: -110 }),
      snapshot({ source_id: "source_2", odds_value: -125, timestamp: "2026-06-05T12:40:00.000Z" }),
    );

    expect(monitor.detectShift(unchanged.previous, unchanged.current)).toEqual({
      status: "NO_MOVEMENT",
      previous_snapshot_id: unchanged.previous.snapshot_id,
      new_snapshot_id: unchanged.current.snapshot_id,
      price_delta: 0,
    });
    expect(monitor.detectShift(null, baseline.current)).toEqual({
      status: "BLOCKED",
      reason: "MISSING_PREVIOUS_SNAPSHOT",
    });
    expect(monitor.detectShift(baseline.previous, differentSource.current)).toEqual({
      status: "BLOCKED",
      reason: "SOURCE_MISMATCH",
    });
    expect(monitor.detectShift(
      cloneRecord(baseline.previous, { snapshot_id: "" }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "MISSING_PREVIOUS_SNAPSHOT_ID",
    });
    expect(monitor.detectShift(
      baseline.previous,
      cloneRecord(baseline.current, { snapshot_id: "" }),
    )).toEqual({
      status: "BLOCKED",
      reason: "MISSING_NEW_SNAPSHOT_ID",
    });
    expect(monitor.detectShift(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          timestamp: "",
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "MISSING_TIMESTAMP",
    });
    expect(monitor.detectShift(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          odds_value: 0,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PREVIOUS_ODDS_INVALID",
    });
    expect(monitor.detectShift(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          odds_value: 99,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PREVIOUS_ODDS_INVALID",
    });
    expect(monitor.detectShift(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          odds_value: -99,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PREVIOUS_ODDS_INVALID",
    });
    expect(monitor.detectShift(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          odds_value: null,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PREVIOUS_ODDS_INVALID",
    });
    expect(monitor.detectShift(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          odds_value: Number.NaN,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PREVIOUS_ODDS_INVALID",
    });
    expect(monitor.detectShift(
      baseline.previous,
      cloneRecord(baseline.current, {
        snapshot_payload: {
          ...baseline.current.snapshot_payload,
          odds_value: "bad" as unknown as number,
        },
      }),
    )).toEqual({
      status: "BLOCKED",
      reason: "NEW_ODDS_INVALID",
    });
  });

  it("stores append-only events, resolves duplicates idempotently, and stays informational only", async () => {
    const monitor = createOddsShiftMonitor({ now: () => new Date("2026-06-05T12:45:00.000Z") });
    const snapshots = createSnapshotRecord(
      snapshot({ odds_value: -110 }),
      snapshot({ odds_value: -125, timestamp: "2026-06-05T12:40:00.000Z" }),
    );

    const first = monitor.detectShift(snapshots.previous, snapshots.current);
    const second = monitor.detectShift(snapshots.previous, snapshots.current);

    expect(first).toMatchObject({
      status: "RECORDED",
      duplicate: false,
      event: {
        previous_snapshot_id: snapshots.previous.snapshot_id,
        new_snapshot_id: snapshots.current.snapshot_id,
      },
    });
    expect(second).toMatchObject({
      status: "RECORDED",
      duplicate: true,
    });
    if (first.status !== "RECORDED" || second.status !== "RECORDED") throw new Error("expected recorded");
    expect(first.event.event_id).toBe(second.event.event_id);
    expect(monitor.listEvents()).toHaveLength(1);

    const listed = monitor.listEvents();
    listed[0].price_delta = 999;
    expect(monitor.listEvents()[0].price_delta).toBe(-15);
    expect("updateEvent" in monitor).toBe(false);

    const moduleExports = await import("@/src/modules/market-snapshot-intake");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();
    expect(exportedNames).toContain("oddsshiftmonitor");
    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("confidence");
    expect(exportedNames).not.toContain("guarantee");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
    expect(exportedNames).not.toContain("bet");
  });
});
