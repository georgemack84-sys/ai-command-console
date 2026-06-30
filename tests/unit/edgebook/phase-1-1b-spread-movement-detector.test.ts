import { describe, expect, it } from "vitest";
import {
  createMarketSnapshotIntakeLayer,
  createSpreadMovementDetector,
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

function spreadSnapshot(overrides: Partial<MarketSnapshotInput> = {}): MarketSnapshotInput {
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
    timestamp: "2026-06-04T12:30:00.000Z",
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
  second?: MarketSnapshotInput,
): { previous: SnapshotRecord; current: SnapshotRecord } {
  const registry = createSourceRegistryStore();
  registerSourceWithOwnership(registry, source());
  registerSourceWithOwnership(registry, source({ source_id: "source_2", source_name: "Second Feed" }));
  const layer = createMarketSnapshotIntakeLayer(registry, { now: () => new Date("2026-06-04T12:31:00.000Z") });

  const previous = layer.intakeSnapshot(first);
  if (previous.status !== "ACCEPTED") throw new Error("expected first snapshot to be accepted");

  const currentInput = second ?? spreadSnapshot({
    line_value: -5.5,
    timestamp: "2026-06-04T12:40:00.000Z",
  });
  const current = layer.intakeSnapshot(currentInput);
  if (current.status !== "ACCEPTED") throw new Error("expected second snapshot to be accepted");

  return {
    previous: previous.record,
    current: current.record,
  };
}

function cloneRecord(record: SnapshotRecord, overrides: Partial<SnapshotRecord> = {}): SnapshotRecord {
  return {
    ...structuredClone(record),
    ...overrides,
  };
}

describe("EdgeBook Phase 1.1B spread movement detector", () => {
  it("detects spread movement, direction, and movement size deterministically", () => {
    const detector = createSpreadMovementDetector({ now: () => new Date("2026-06-04T12:45:00.000Z") });
    const negativeMove = createSnapshotRecord(
      spreadSnapshot({ line_value: -4.5, timestamp: "2026-06-04T12:30:00.000Z" }),
      spreadSnapshot({ line_value: -5.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const positiveDown = createSnapshotRecord(
      spreadSnapshot({ line_value: 3.0, participant: "New York Knicks", timestamp: "2026-06-04T12:30:00.000Z" }),
      spreadSnapshot({ line_value: 2.5, participant: "New York Knicks", timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const positiveUp = createSnapshotRecord(
      spreadSnapshot({ line_value: 3.0, participant: "Los Angeles Lakers", timestamp: "2026-06-04T12:30:00.000Z" }),
      spreadSnapshot({ line_value: 4.0, participant: "Los Angeles Lakers", timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    const first = detector.detectMovement(negativeMove.previous, negativeMove.current);
    const second = detector.detectMovement(positiveDown.previous, positiveDown.current);
    const third = detector.detectMovement(positiveUp.previous, positiveUp.current);

    expect(first).toMatchObject({
      status: "RECORDED",
      duplicate: false,
      event: {
        event_type: "SPREAD_MOVEMENT",
        movement_direction: "DOWN",
        movement_size: 1,
        spread_effect: "FAVORITE_BECAME_STRONGER",
        previous_value: -4.5,
        new_value: -5.5,
        detected_at: "2026-06-04T12:45:00.000Z",
      },
    });
    expect(second).toMatchObject({
      status: "RECORDED",
      event: {
        movement_direction: "DOWN",
        movement_size: 0.5,
        spread_effect: "UNDERDOG_BECAME_STRONGER",
      },
    });
    expect(third).toMatchObject({
      status: "RECORDED",
      event: {
        movement_direction: "UP",
        movement_size: 1,
        spread_effect: "UNDERDOG_BECAME_WEAKER",
      },
    });
  });

  it("classifies favorite, underdog, and pickem spread effects", () => {
    const detector = createSpreadMovementDetector();
    const favoriteWeaker = createSnapshotRecord(
      spreadSnapshot({ line_value: -5.5 }),
      spreadSnapshot({ line_value: -4.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const underdogWeaker = createSnapshotRecord(
      spreadSnapshot({ line_value: 4.5, participant: "Dallas Mavericks" }),
      spreadSnapshot({ line_value: 5.5, participant: "Dallas Mavericks", timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const pickemFlip = createSnapshotRecord(
      spreadSnapshot({ line_value: 1.0, participant: "Miami Heat" }),
      spreadSnapshot({ line_value: -1.0, participant: "Miami Heat", timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const pickemFromZero = createSnapshotRecord(
      spreadSnapshot({ line_value: 0, participant: "Phoenix Suns" }),
      spreadSnapshot({ line_value: -1.5, participant: "Phoenix Suns", timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const pickemToZero = createSnapshotRecord(
      spreadSnapshot({ line_value: 1.5, participant: "Denver Nuggets" }),
      spreadSnapshot({ line_value: 0, participant: "Denver Nuggets", timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(favoriteWeaker.previous, favoriteWeaker.current)).toMatchObject({
      status: "RECORDED",
      event: { spread_effect: "FAVORITE_BECAME_WEAKER", movement_direction: "UP" },
    });
    expect(detector.detectMovement(underdogWeaker.previous, underdogWeaker.current)).toMatchObject({
      status: "RECORDED",
      event: { spread_effect: "UNDERDOG_BECAME_WEAKER", movement_direction: "UP" },
    });
    expect(detector.detectMovement(pickemFlip.previous, pickemFlip.current)).toMatchObject({
      status: "RECORDED",
      event: { spread_effect: "PICKEM_TRANSITION" },
    });
    expect(detector.detectMovement(pickemFromZero.previous, pickemFromZero.current)).toMatchObject({
      status: "RECORDED",
      event: { spread_effect: "PICKEM_TRANSITION" },
    });
    expect(detector.detectMovement(pickemToZero.previous, pickemToZero.current)).toMatchObject({
      status: "RECORDED",
      event: { spread_effect: "PICKEM_TRANSITION" },
    });
  });

  it("returns no movement when spread values are equal", () => {
    const detector = createSpreadMovementDetector();
    const snapshots = createSnapshotRecord(
      spreadSnapshot({ line_value: -4.5 }),
      spreadSnapshot({ line_value: -4.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(snapshots.previous, snapshots.current)).toEqual({
      status: "NO_MOVEMENT",
      previous_snapshot_id: snapshots.previous.snapshot_id,
      new_snapshot_id: snapshots.current.snapshot_id,
      movement_size: 0,
    });
    expect(detector.listEvents()).toHaveLength(0);
  });

  it("blocks missing snapshots, mismatched identity, invalid line values, and missing snapshot ids", () => {
    const detector = createSpreadMovementDetector();
    const baseline = createSnapshotRecord(
      spreadSnapshot({ line_value: -4.5 }),
      spreadSnapshot({ line_value: -5.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const differentSource = createSnapshotRecord(
      spreadSnapshot({ source_id: "source_2", line_value: -4.5 }),
      spreadSnapshot({ source_id: "source_2", line_value: -5.5, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const nonSpread = createSnapshotRecord(
      spreadSnapshot({ market_type: "TOTAL", market_subtype: "GAME_TOTAL", line_value: 221.5, participant: null }),
      spreadSnapshot({ market_type: "TOTAL", market_subtype: "GAME_TOTAL", line_value: 222.5, participant: null, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(null, baseline.current)).toEqual({
      status: "BLOCKED",
      reason: "MISSING_PREVIOUS_SNAPSHOT",
    });
    expect(detector.detectMovement(baseline.previous, differentSource.current)).toEqual({
      status: "BLOCKED",
      reason: "SOURCE_MISMATCH",
    });
    expect(detector.detectMovement(baseline.previous, nonSpread.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_MISMATCH",
    });
    expect(detector.detectMovement(nonSpread.previous, nonSpread.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_NOT_SPREAD_RELATED",
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
          line_value: null,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PREVIOUS_LINE_VALUE_INVALID",
    });
    expect(detector.detectMovement(
      baseline.previous,
      cloneRecord(baseline.current, {
        snapshot_payload: {
          ...baseline.current.snapshot_payload,
          line_value: null,
        },
      }),
    )).toEqual({
      status: "BLOCKED",
      reason: "NEW_LINE_VALUE_INVALID",
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
      reason: "PREVIOUS_LINE_VALUE_INVALID",
    });
  });

  it("supports alternate spreads and keeps them separate from the main spread market identity", () => {
    const detector = createSpreadMovementDetector({ now: () => new Date("2026-06-04T12:45:00.000Z") });
    const alternate = createSnapshotRecord(
      spreadSnapshot({
        market_type: "ALTERNATE_SPREAD",
        market_subtype: "ALTERNATE_SPREAD",
        line_value: 3.0,
        participant: "Indiana Pacers",
      }),
      spreadSnapshot({
        market_type: "ALTERNATE_SPREAD",
        market_subtype: "ALTERNATE_SPREAD",
        line_value: 4.0,
        participant: "Indiana Pacers",
        timestamp: "2026-06-04T12:40:00.000Z",
      }),
    );
    const main = createSnapshotRecord(
      spreadSnapshot({
        market_type: "SPREAD",
        market_subtype: "FULL_GAME_SPREAD",
        line_value: 3.0,
        participant: "Indiana Pacers",
      }),
      spreadSnapshot({
        market_type: "SPREAD",
        market_subtype: "FULL_GAME_SPREAD",
        line_value: 4.0,
        participant: "Indiana Pacers",
        timestamp: "2026-06-04T12:40:00.000Z",
      }),
    );

    expect(alternate.previous.market_id).not.toBe(main.previous.market_id);
    expect(detector.detectMovement(alternate.previous, alternate.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_direction: "UP", market_id: alternate.current.market_id },
    });
    expect(detector.detectMovement(main.previous, alternate.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_MISMATCH",
    });
  });

  it("stores movement events append-only, preserves snapshot references, and resolves duplicates idempotently", () => {
    const detector = createSpreadMovementDetector({ now: () => new Date("2026-06-04T12:45:00.000Z") });
    const snapshots = createSnapshotRecord(
      spreadSnapshot({ line_value: -4.5 }),
      spreadSnapshot({ line_value: -5.5, timestamp: "2026-06-04T12:40:00.000Z" }),
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
    listed[0].movement_size = 999;
    expect(detector.listEvents()[0].movement_size).toBe(1);
    expect("updateEvent" in detector).toBe(false);
  });

  it("stays informational only and does not expose recommendation or confidence language", async () => {
    const moduleExports = await import("@/src/modules/market-snapshot-intake");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportedNames).toContain("spreadmovementdetector");
    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("confidence");
    expect(exportedNames).not.toContain("guarantee");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
    expect(exportedNames).not.toContain("bet");
  });
});
