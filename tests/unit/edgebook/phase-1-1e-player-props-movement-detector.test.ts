import { describe, expect, it } from "vitest";
import {
  createMarketSnapshotIntakeLayer,
  createPlayerPropsMovementDetector,
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

function playerPropSnapshot(overrides: Partial<MarketSnapshotInput> = {}): MarketSnapshotInput {
  return {
    source_id: "source_1",
    sport: "Basketball",
    league: "NBA",
    event_id: "event_1",
    market_type: "PLAYER_PROP",
    market_subtype: "PLAYER_POINTS",
    participant: "LeBron James",
    player_id: "player_lebron_james",
    player_name: "LeBron James",
    team: "Los Angeles Lakers",
    prop_type: "points",
    availability_status: "AVAILABLE",
    line_value: 24.5,
    odds_value: -120,
    timestamp: "2026-06-04T12:30:00.000Z",
    schema_version: "1.1.0",
    raw_payload_json: {
      bookmaker: "Mock Sportsbook Feed",
      market: "player prop",
      player: "LeBron James",
      team: "Los Angeles Lakers",
      prop: "points",
      line: 24.5,
      price: -120,
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

describe("EdgeBook Phase 1.1E player props movement detector", () => {
  it("detects player prop line movement and classifies higher and lower", () => {
    const detector = createPlayerPropsMovementDetector({ now: () => new Date("2026-06-04T12:45:00.000Z") });
    const higher = createSnapshotRecord(
      playerPropSnapshot({ line_value: 24.5, odds_value: -120 }),
      playerPropSnapshot({ line_value: 25.5, odds_value: -120, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const lower = createSnapshotRecord(
      playerPropSnapshot({ player_id: "player_anthony_davis", player_name: "Anthony Davis", participant: "Anthony Davis", prop_type: "rebounds", market_subtype: "PLAYER_REBOUNDS", line_value: 8.5 }),
      playerPropSnapshot({ player_id: "player_anthony_davis", player_name: "Anthony Davis", participant: "Anthony Davis", prop_type: "rebounds", market_subtype: "PLAYER_REBOUNDS", line_value: 7.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(higher.previous, higher.current)).toMatchObject({
      status: "RECORDED",
      duplicate: false,
      event: {
        movement_type: "PROP_LINE_MOVEMENT",
        movement_direction: "HIGHER",
        line_movement_size: 1,
        detected_at: "2026-06-04T12:45:00.000Z",
      },
    });
    expect(detector.detectMovement(lower.previous, lower.current)).toMatchObject({
      status: "RECORDED",
      event: {
        movement_type: "PROP_LINE_MOVEMENT",
        movement_direction: "LOWER",
        line_movement_size: 1,
      },
    });
  });

  it("detects player prop odds movement and classifies shortening and drifting", () => {
    const detector = createPlayerPropsMovementDetector();
    const shortenedPositive = createSnapshotRecord(
      playerPropSnapshot({ odds_value: 180 }),
      playerPropSnapshot({ odds_value: 150, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const shortenedNegative = createSnapshotRecord(
      playerPropSnapshot({ player_id: "player_steph_curry", player_name: "Stephen Curry", participant: "Stephen Curry", prop_type: "threes", market_subtype: "PLAYER_THREES", odds_value: -120 }),
      playerPropSnapshot({ player_id: "player_steph_curry", player_name: "Stephen Curry", participant: "Stephen Curry", prop_type: "threes", market_subtype: "PLAYER_THREES", odds_value: -150, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const driftedPositive = createSnapshotRecord(
      playerPropSnapshot({ player_id: "player_jayson_tatum", player_name: "Jayson Tatum", participant: "Jayson Tatum", odds_value: 150 }),
      playerPropSnapshot({ player_id: "player_jayson_tatum", player_name: "Jayson Tatum", participant: "Jayson Tatum", odds_value: 190, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const driftedNegative = createSnapshotRecord(
      playerPropSnapshot({ player_id: "player_kevin_durant", player_name: "Kevin Durant", participant: "Kevin Durant", odds_value: -150 }),
      playerPropSnapshot({ player_id: "player_kevin_durant", player_name: "Kevin Durant", participant: "Kevin Durant", odds_value: -120, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(shortenedPositive.previous, shortenedPositive.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_type: "PROP_ODDS_MOVEMENT", movement_direction: "PRICE_SHORTENED", odds_delta: -30 },
    });
    expect(detector.detectMovement(shortenedNegative.previous, shortenedNegative.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_direction: "PRICE_SHORTENED", odds_delta: -30 },
    });
    expect(detector.detectMovement(driftedPositive.previous, driftedPositive.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_direction: "PRICE_DRIFTED", odds_delta: 40 },
    });
    expect(detector.detectMovement(driftedNegative.previous, driftedNegative.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_direction: "PRICE_DRIFTED", odds_delta: 30 },
    });
  });

  it("detects combined line and odds movement while preserving separate measurements", () => {
    const detector = createPlayerPropsMovementDetector();
    const snapshots = createSnapshotRecord(
      playerPropSnapshot({ line_value: 24.5, odds_value: 180 }),
      playerPropSnapshot({ line_value: 25.5, odds_value: 150, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(snapshots.previous, snapshots.current)).toMatchObject({
      status: "RECORDED",
      event: {
        movement_type: "PROP_LINE_AND_ODDS_MOVEMENT",
        movement_direction: "HIGHER",
        line_movement_size: 1,
        odds_delta: -30,
      },
    });
  });

  it("detects availability changes and preserves unavailable prop history", () => {
    const detector = createPlayerPropsMovementDetector();
    const suspended = createSnapshotRecord(
      playerPropSnapshot({ availability_status: "AVAILABLE" }),
      playerPropSnapshot({ availability_status: "SUSPENDED", timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const removed = createSnapshotRecord(
      playerPropSnapshot({ player_id: "player_devin_booker", player_name: "Devin Booker", participant: "Devin Booker", availability_status: "AVAILABLE" }),
      playerPropSnapshot({ player_id: "player_devin_booker", player_name: "Devin Booker", participant: "Devin Booker", availability_status: "REMOVED", timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const restored = createSnapshotRecord(
      playerPropSnapshot({ player_id: "player_damian_lillard", player_name: "Damian Lillard", participant: "Damian Lillard", availability_status: "REMOVED" }),
      playerPropSnapshot({ player_id: "player_damian_lillard", player_name: "Damian Lillard", participant: "Damian Lillard", availability_status: "AVAILABLE", timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(suspended.previous, suspended.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_type: "PROP_AVAILABILITY_CHANGE", movement_direction: "UNAVAILABLE", availability_new: "SUSPENDED" },
    });
    expect(detector.detectMovement(removed.previous, removed.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_direction: "UNAVAILABLE", availability_new: "REMOVED" },
    });
    expect(detector.detectMovement(restored.previous, restored.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_direction: "AVAILABLE", availability_previous: "REMOVED", availability_new: "AVAILABLE" },
    });
  });

  it("supports alternate props and keeps them separate from standard prop markets", () => {
    const detector = createPlayerPropsMovementDetector();
    const alternate = createSnapshotRecord(
      playerPropSnapshot({ market_subtype: "alternate_player_prop", line_value: 29.5 }),
      playerPropSnapshot({ market_subtype: "alternate_player_prop", line_value: 30.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const standard = createSnapshotRecord(
      playerPropSnapshot({ market_subtype: "PLAYER_POINTS", line_value: 29.5 }),
      playerPropSnapshot({ market_subtype: "PLAYER_POINTS", line_value: 30.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(alternate.previous.market_id).not.toBe(standard.previous.market_id);
    expect(detector.detectMovement(alternate.previous, alternate.current)).toMatchObject({
      status: "RECORDED",
      event: { market_subtype: "alternate_player_prop" },
    });
    expect(detector.detectMovement(standard.previous, alternate.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_MISMATCH",
    });
  });

  it("blocks missing identity, mismatched player or prop identity, invalid values, and non-player-prop markets", () => {
    const detector = createPlayerPropsMovementDetector();
    const baseline = createSnapshotRecord(
      playerPropSnapshot({ line_value: 24.5, odds_value: -120 }),
      playerPropSnapshot({ line_value: 25.5, odds_value: -120, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const differentSource = createSnapshotRecord(
      playerPropSnapshot({ source_id: "source_2" }),
      playerPropSnapshot({ source_id: "source_2", line_value: 25.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const nonProp = createSnapshotRecord(
      playerPropSnapshot({ market_type: "TOTAL", market_subtype: "GAME_TOTAL", participant: null, player_id: null, player_name: null, prop_type: null, line_value: 221.5 }),
      playerPropSnapshot({ market_type: "TOTAL", market_subtype: "GAME_TOTAL", participant: null, player_id: null, player_name: null, prop_type: null, line_value: 223.0, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(null, baseline.current)).toEqual({
      status: "BLOCKED",
      reason: "MISSING_PREVIOUS_SNAPSHOT",
    });
    expect(detector.detectMovement(baseline.previous, differentSource.current)).toEqual({
      status: "BLOCKED",
      reason: "SOURCE_MISMATCH",
    });
    expect(detector.detectMovement(nonProp.previous, nonProp.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_NOT_PLAYER_PROP",
    });
    expect(detector.detectMovement(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          player_id: null,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PLAYER_ID_MISSING",
    });
    expect(detector.detectMovement(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          player_name: null,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PLAYER_NAME_MISSING",
    });
    expect(detector.detectMovement(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          prop_type: null,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PROP_TYPE_MISSING",
    });
    expect(detector.detectMovement(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          player_id: "other_player",
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PLAYER_ID_MISMATCH",
    });
    expect(detector.detectMovement(
      cloneRecord(baseline.previous, {
        snapshot_payload: {
          ...baseline.previous.snapshot_payload,
          prop_type: "rebounds",
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PROP_TYPE_MISMATCH",
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
          line_value: 24.5,
        },
      }),
      cloneRecord(baseline.current, {
        snapshot_payload: {
          ...baseline.current.snapshot_payload,
          line_value: 24.5,
          odds_value: -150,
        },
      }),
    )).toEqual({
      status: "BLOCKED",
      reason: "ODDS_VALUE_INVALID",
    });
  });

  it("stores events append-only, resolves duplicates idempotently, and stays informational only", async () => {
    const detector = createPlayerPropsMovementDetector({ now: () => new Date("2026-06-04T12:45:00.000Z") });
    const snapshots = createSnapshotRecord(
      playerPropSnapshot({ odds_value: 180 }),
      playerPropSnapshot({ odds_value: 150, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

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
    listed[0].line_movement_size = 999;
    expect(detector.listEvents()[0].line_movement_size).toBe(0);
    expect("updateEvent" in detector).toBe(false);

    const moduleExports = await import("@/src/modules/market-snapshot-intake");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();
    expect(exportedNames).toContain("playerpropsmovementdetector");
    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("confidence");
    expect(exportedNames).not.toContain("guarantee");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
    expect(exportedNames).not.toContain("bet");
  });
});
