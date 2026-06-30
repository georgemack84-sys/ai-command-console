import { describe, expect, it } from "vitest";
import {
  createMarketSnapshotIntakeLayer,
  createTotalsMovementDetector,
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
    created_at: "2026-06-04T12:00:00.000Z",
    version: "1.1.0",
    ...overrides,
  };
}

function totalSnapshot(overrides: Partial<MarketSnapshotInput> = {}): MarketSnapshotInput {
  return {
    source_id: "source_1",
    sport: "Basketball",
    league: "NBA",
    event_id: "event_1",
    market_type: "TOTAL",
    market_subtype: "GAME_TOTAL",
    participant: null,
    side: "over",
    line_value: 221.5,
    odds_value: -110,
    timestamp: "2026-06-04T12:30:00.000Z",
    schema_version: "1.1.0",
    raw_payload_json: {
      bookmaker: "Mock Sportsbook Feed",
      market: "game total",
      side: "over",
      line: 221.5,
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
  const layer = createMarketSnapshotIntakeLayer(registry, { now: () => new Date("2026-06-04T12:31:00.000Z") });

  const previous = layer.intakeSnapshot(first);
  if (previous.status !== "ACCEPTED") throw new Error("expected first snapshot to be accepted");
  const current = layer.intakeSnapshot(second);
  if (current.status !== "ACCEPTED") throw new Error("expected second snapshot to be accepted");

  return { previous: previous.record, current: current.record };
}

function cloneRecord(record: SnapshotRecord, overrides: Partial<SnapshotRecord> = {}): SnapshotRecord {
  return {
    ...structuredClone(record),
    ...overrides,
  };
}

describe("EdgeBook Phase 1.1C totals movement detector", () => {
  it("detects higher and lower totals movement with deterministic size", () => {
    const detector = createTotalsMovementDetector({ now: () => new Date("2026-06-04T12:45:00.000Z") });
    const higher = createSnapshotRecord(
      totalSnapshot({ line_value: 221.5, odds_value: -110 }),
      totalSnapshot({ line_value: 223.0, odds_value: -125, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const lower = createSnapshotRecord(
      totalSnapshot({ market_type: "TEAM_TOTAL", market_subtype: "TEAM_TOTAL_HOME", participant: "Boston Celtics", line_value: 48.0 }),
      totalSnapshot({ market_type: "TEAM_TOTAL", market_subtype: "TEAM_TOTAL_HOME", participant: "Boston Celtics", line_value: 46.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(higher.previous, higher.current)).toMatchObject({
      status: "RECORDED",
      duplicate: false,
      event: {
        movement_direction: "HIGHER",
        movement_size: 1.5,
        totals_scope: "GAME_TOTAL",
        price_side: "OVER",
        odds_delta: -15,
        detected_at: "2026-06-04T12:45:00.000Z",
      },
    });
    expect(detector.detectMovement(lower.previous, lower.current)).toMatchObject({
      status: "RECORDED",
      event: {
        movement_direction: "LOWER",
        movement_size: 1.5,
        totals_scope: "TEAM_TOTAL",
      },
    });
  });

  it("ignores unchanged totals when odds are unchanged and detects price-only movement otherwise", () => {
    const detector = createTotalsMovementDetector();
    const unchanged = createSnapshotRecord(
      totalSnapshot({ line_value: 221.5, odds_value: -110 }),
      totalSnapshot({ line_value: 221.5, odds_value: -110, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const priceOnly = createSnapshotRecord(
      totalSnapshot({ line_value: 221.5, odds_value: -110, side: "under" }),
      totalSnapshot({ line_value: 221.5, odds_value: 100, side: "under", timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(unchanged.previous, unchanged.current)).toEqual({
      status: "NO_MOVEMENT",
      previous_snapshot_id: unchanged.previous.snapshot_id,
      new_snapshot_id: unchanged.current.snapshot_id,
      movement_size: 0,
      odds_delta: 0,
    });
    expect(detector.detectMovement(priceOnly.previous, priceOnly.current)).toMatchObject({
      status: "RECORDED",
      event: {
        movement_direction: "PRICE_ONLY",
        movement_size: 0,
        price_side: "UNDER",
        odds_delta: 210,
      },
    });
  });

  it("supports game total, team total, and alternate total scopes while preserving market separation", () => {
    const detector = createTotalsMovementDetector();
    const game = createSnapshotRecord(
      totalSnapshot({ market_type: "TOTAL", market_subtype: "GAME_TOTAL", participant: null }),
      totalSnapshot({ market_type: "TOTAL", market_subtype: "GAME_TOTAL", participant: null, line_value: 223.0, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const team = createSnapshotRecord(
      totalSnapshot({ market_type: "TEAM_TOTAL", market_subtype: "TEAM_TOTAL_AWAY", participant: "New York Knicks", line_value: 108.5 }),
      totalSnapshot({ market_type: "TEAM_TOTAL", market_subtype: "TEAM_TOTAL_AWAY", participant: "New York Knicks", line_value: 110.0, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const alternate = createSnapshotRecord(
      totalSnapshot({ market_type: "ALTERNATE_TOTAL", market_subtype: "ALTERNATE_TOTAL", line_value: 229.5 }),
      totalSnapshot({ market_type: "ALTERNATE_TOTAL", market_subtype: "ALTERNATE_TOTAL", line_value: 231.0, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const standard = createSnapshotRecord(
      totalSnapshot({ market_type: "TOTAL", market_subtype: "GAME_TOTAL", line_value: 229.5 }),
      totalSnapshot({ market_type: "TOTAL", market_subtype: "GAME_TOTAL", line_value: 231.0, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(game.previous, game.current)).toMatchObject({
      status: "RECORDED",
      event: { totals_scope: "GAME_TOTAL" },
    });
    expect(detector.detectMovement(team.previous, team.current)).toMatchObject({
      status: "RECORDED",
      event: { totals_scope: "TEAM_TOTAL" },
    });
    expect(detector.detectMovement(alternate.previous, alternate.current)).toMatchObject({
      status: "RECORDED",
      event: { totals_scope: "ALTERNATE_TOTAL" },
    });
    expect(alternate.previous.market_id).not.toBe(standard.previous.market_id);
    expect(detector.detectMovement(game.previous, team.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_MISMATCH",
    });
  });

  it("detects over and under price movement and classifies missing side as unknown", () => {
    const detector = createTotalsMovementDetector();
    const over = createSnapshotRecord(
      totalSnapshot({ side: "over", odds_value: -110 }),
      totalSnapshot({ side: "over", odds_value: -125, line_value: 221.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const under = createSnapshotRecord(
      totalSnapshot({ side: "under", odds_value: -110 }),
      totalSnapshot({ side: "under", odds_value: 100, line_value: 221.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const unknown = createSnapshotRecord(
      totalSnapshot({ side: null, odds_value: -110 }),
      totalSnapshot({ side: null, odds_value: -105, line_value: 221.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(over.previous, over.current)).toMatchObject({
      status: "RECORDED",
      event: { price_side: "OVER", odds_delta: -15 },
    });
    expect(detector.detectMovement(under.previous, under.current)).toMatchObject({
      status: "RECORDED",
      event: { price_side: "UNDER", odds_delta: 210 },
    });
    expect(detector.detectMovement(unknown.previous, unknown.current)).toMatchObject({
      status: "RECORDED",
      event: { price_side: "UNKNOWN" },
    });
  });

  it("blocks missing previous snapshots, mismatched identity, missing timestamps, invalid values, and non-total markets", () => {
    const detector = createTotalsMovementDetector();
    const baseline = createSnapshotRecord(
      totalSnapshot({ line_value: 221.5, odds_value: -110 }),
      totalSnapshot({ line_value: 223.0, odds_value: -125, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const differentSource = createSnapshotRecord(
      totalSnapshot({ source_id: "source_2", line_value: 221.5 }),
      totalSnapshot({ source_id: "source_2", line_value: 223.0, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const differentSubtype = createSnapshotRecord(
      totalSnapshot({ market_subtype: "GAME_TOTAL" }),
      totalSnapshot({ market_subtype: "FIRST_HALF_TOTAL", line_value: 223.0, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const nonTotal = createSnapshotRecord(
      totalSnapshot({ market_type: "SPREAD", market_subtype: "FULL_GAME_SPREAD", participant: "Boston Celtics", line_value: -4.5 }),
      totalSnapshot({ market_type: "SPREAD", market_subtype: "FULL_GAME_SPREAD", participant: "Boston Celtics", line_value: -5.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(null, baseline.current)).toEqual({
      status: "BLOCKED",
      reason: "MISSING_PREVIOUS_SNAPSHOT",
    });
    expect(detector.detectMovement(baseline.previous, differentSource.current)).toEqual({
      status: "BLOCKED",
      reason: "SOURCE_MISMATCH",
    });
    expect(detector.detectMovement(baseline.previous, differentSubtype.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_MISMATCH",
    });
    expect(detector.detectMovement(nonTotal.previous, nonTotal.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_NOT_TOTALS_RELATED",
    });
    expect(detector.detectMovement(
      cloneRecord(baseline.previous, { snapshot_id: "" }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "MISSING_PREVIOUS_SNAPSHOT_ID",
    });
    expect(detector.detectMovement(
      baseline.previous,
      cloneRecord(baseline.current, { snapshot_id: "" }),
    )).toEqual({
      status: "BLOCKED",
      reason: "MISSING_NEW_SNAPSHOT_ID",
    });
    expect(detector.detectMovement(
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
    expect(detector.detectMovement(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          line_value: null,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "LINE_VALUE_INVALID",
    });
    expect(detector.detectMovement(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          line_value: "bad" as unknown as number,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "LINE_VALUE_INVALID",
    });
    expect(detector.detectMovement(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          odds_value: "bad" as unknown as number,
          line_value: 221.5,
        },
      }),
      cloneRecord(baseline.current, {
        snapshot_payload: {
          ...baseline.current.snapshot_payload,
          line_value: 221.5,
          odds_value: -125,
        },
      }),
    )).toEqual({
      status: "BLOCKED",
      reason: "ODDS_VALUE_INVALID",
    });
  });

  it("blocks participant mismatches and keeps storage append-only with duplicate idempotency", () => {
    const detector = createTotalsMovementDetector({ now: () => new Date("2026-06-04T12:45:00.000Z") });
    const snapshots = createSnapshotRecord(
      totalSnapshot({ market_type: "TEAM_TOTAL", market_subtype: "TEAM_TOTAL_HOME", participant: "Boston Celtics", line_value: 112.5 }),
      totalSnapshot({ market_type: "TEAM_TOTAL", market_subtype: "TEAM_TOTAL_HOME", participant: "Boston Celtics", line_value: 114.0, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const mismatch = createSnapshotRecord(
      totalSnapshot({ market_type: "TEAM_TOTAL", market_subtype: "TEAM_TOTAL_HOME", participant: "Boston Celtics", line_value: 112.5 }),
      totalSnapshot({ market_type: "TEAM_TOTAL", market_subtype: "TEAM_TOTAL_HOME", participant: "Los Angeles Lakers", line_value: 114.0, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(mismatch.previous, mismatch.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_MISMATCH",
    });

    const first = detector.detectMovement(snapshots.previous, snapshots.current);
    const second = detector.detectMovement(snapshots.previous, snapshots.current);

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
    expect(detector.listEvents()).toHaveLength(1);

    const listed = detector.listEvents();
    listed[0].movement_size = 999;
    expect(detector.listEvents()[0].movement_size).toBe(1.5);
    expect("updateEvent" in detector).toBe(false);
  });

  it("stays informational only and does not expose recommendation, confidence, or wagering language", async () => {
    const moduleExports = await import("@/src/modules/market-snapshot-intake");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportedNames).toContain("totalsmovementdetector");
    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("confidence");
    expect(exportedNames).not.toContain("guarantee");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
    expect(exportedNames).not.toContain("bet");
  });
});
