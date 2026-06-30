import { describe, expect, it } from "vitest";
import {
  createMarketSnapshotIntakeLayer,
  createMoneylineMovementDetector,
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

function moneylineSnapshot(overrides: Partial<MarketSnapshotInput> = {}): MarketSnapshotInput {
  return {
    source_id: "source_1",
    sport: "Basketball",
    league: "NBA",
    event_id: "event_1",
    market_type: "MONEYLINE",
    market_subtype: "FULL_GAME_MONEYLINE",
    participant: "Boston Celtics",
    line_value: null,
    odds_value: -140,
    timestamp: "2026-06-04T12:30:00.000Z",
    schema_version: "1.1.0",
    raw_payload_json: {
      bookmaker: "Mock Sportsbook Feed",
      market: "moneyline",
      odds: -140,
      team: "Boston Celtics",
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

describe("EdgeBook Phase 1.1D moneyline movement detector", () => {
  it("detects moneyline movement, price delta, and direction deterministically", () => {
    const detector = createMoneylineMovementDetector({ now: () => new Date("2026-06-04T12:45:00.000Z") });
    const favoriteShortened = createSnapshotRecord(
      moneylineSnapshot({ odds_value: -140 }),
      moneylineSnapshot({ odds_value: -170, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const underdogShortened = createSnapshotRecord(
      moneylineSnapshot({ participant: "New York Knicks", odds_value: 120 }),
      moneylineSnapshot({ participant: "New York Knicks", odds_value: 105, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const underdogDrifted = createSnapshotRecord(
      moneylineSnapshot({ participant: "Los Angeles Lakers", odds_value: 200 }),
      moneylineSnapshot({ participant: "Los Angeles Lakers", odds_value: 240, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(favoriteShortened.previous, favoriteShortened.current)).toMatchObject({
      status: "RECORDED",
      duplicate: false,
      event: {
        movement_direction: "FAVORITE_SHORTENED",
        price_delta: -30,
        detected_at: "2026-06-04T12:45:00.000Z",
      },
    });
    expect(detector.detectMovement(underdogShortened.previous, underdogShortened.current)).toMatchObject({
      status: "RECORDED",
      event: {
        movement_direction: "UNDERDOG_SHORTENED",
        price_delta: -15,
      },
    });
    expect(detector.detectMovement(underdogDrifted.previous, underdogDrifted.current)).toMatchObject({
      status: "RECORDED",
      event: {
        movement_direction: "UNDERDOG_DRIFTED",
        price_delta: 40,
      },
    });
  });

  it("classifies favorite drifting and cross-zero transitions", () => {
    const detector = createMoneylineMovementDetector();
    const favoriteDrifted = createSnapshotRecord(
      moneylineSnapshot({ odds_value: -170 }),
      moneylineSnapshot({ odds_value: -140, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const crossToPositive = createSnapshotRecord(
      moneylineSnapshot({ participant: "Miami Heat", odds_value: -105 }),
      moneylineSnapshot({ participant: "Miami Heat", odds_value: 105, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const crossToNegative = createSnapshotRecord(
      moneylineSnapshot({ participant: "Denver Nuggets", odds_value: 105 }),
      moneylineSnapshot({ participant: "Denver Nuggets", odds_value: -105, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(favoriteDrifted.previous, favoriteDrifted.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_direction: "FAVORITE_DRIFTED" },
    });
    expect(detector.detectMovement(crossToPositive.previous, crossToPositive.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_direction: "CROSS_ZERO_TRANSITION" },
    });
    expect(detector.detectMovement(crossToNegative.previous, crossToNegative.current)).toMatchObject({
      status: "RECORDED",
      event: { movement_direction: "CROSS_ZERO_TRANSITION" },
    });
  });

  it("calculates implied probability shifts deterministically", () => {
    const detector = createMoneylineMovementDetector();
    const favorite = createSnapshotRecord(
      moneylineSnapshot({ odds_value: -140 }),
      moneylineSnapshot({ odds_value: -170, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const underdog = createSnapshotRecord(
      moneylineSnapshot({ participant: "Miami Heat", odds_value: 120 }),
      moneylineSnapshot({ participant: "Miami Heat", odds_value: 105, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    const favoriteResult = detector.detectMovement(favorite.previous, favorite.current);
    const underdogResult = detector.detectMovement(underdog.previous, underdog.current);

    expect(favoriteResult).toMatchObject({
      status: "RECORDED",
      event: {
        implied_probability_previous: expect.closeTo(0.5833, 4),
        implied_probability_new: expect.closeTo(0.6296, 4),
        implied_probability_delta: expect.closeTo(0.0463, 4),
      },
    });
    expect(underdogResult).toMatchObject({
      status: "RECORDED",
      event: {
        implied_probability_previous: expect.closeTo(0.4545, 4),
        implied_probability_new: expect.closeTo(0.4878, 4),
      },
    });
  });

  it("returns no movement when odds are unchanged", () => {
    const detector = createMoneylineMovementDetector();
    const snapshots = createSnapshotRecord(
      moneylineSnapshot({ odds_value: -140 }),
      moneylineSnapshot({ odds_value: -140, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(snapshots.previous, snapshots.current)).toEqual({
      status: "NO_MOVEMENT",
      previous_snapshot_id: snapshots.previous.snapshot_id,
      new_snapshot_id: snapshots.current.snapshot_id,
      price_delta: 0,
    });
  });

  it("blocks invalid american odds, missing timestamps, mismatched identity, and non-moneyline markets", () => {
    const detector = createMoneylineMovementDetector();
    const baseline = createSnapshotRecord(
      moneylineSnapshot({ odds_value: -140 }),
      moneylineSnapshot({ odds_value: -170, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const differentSource = createSnapshotRecord(
      moneylineSnapshot({ source_id: "source_2", odds_value: -140 }),
      moneylineSnapshot({ source_id: "source_2", odds_value: -170, timestamp: "2026-06-04T12:40:00.000Z" }),
    );
    const nonMoneyline = createSnapshotRecord(
      moneylineSnapshot({ market_type: "SPREAD", market_subtype: "FULL_GAME_SPREAD", line_value: -4.5, odds_value: -110 }),
      moneylineSnapshot({ market_type: "SPREAD", market_subtype: "FULL_GAME_SPREAD", line_value: -5.5, odds_value: -110, timestamp: "2026-06-04T12:40:00.000Z" }),
    );

    expect(detector.detectMovement(null, baseline.current)).toEqual({
      status: "BLOCKED",
      reason: "MISSING_PREVIOUS_SNAPSHOT",
    });
    expect(detector.detectMovement(baseline.previous, differentSource.current)).toEqual({
      status: "BLOCKED",
      reason: "SOURCE_MISMATCH",
    });
    expect(detector.detectMovement(nonMoneyline.previous, nonMoneyline.current)).toEqual({
      status: "BLOCKED",
      reason: "MARKET_NOT_MONEYLINE",
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
          odds_value: 0,
        },
      }),
      baseline.current,
    )).toEqual({
      status: "BLOCKED",
      reason: "PREVIOUS_ODDS_INVALID",
    });
    expect(detector.detectMovement(
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
    expect(detector.detectMovement(
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
    expect(detector.detectMovement(
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
    expect(detector.detectMovement(
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
    expect(detector.detectMovement(
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

  it("stores events append-only, preserves snapshot references, and resolves duplicates idempotently", () => {
    const detector = createMoneylineMovementDetector({ now: () => new Date("2026-06-04T12:45:00.000Z") });
    const snapshots = createSnapshotRecord(
      moneylineSnapshot({ odds_value: -140 }),
      moneylineSnapshot({ odds_value: -170, timestamp: "2026-06-04T12:40:00.000Z" }),
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
    listed[0].price_delta = 999;
    expect(detector.listEvents()[0].price_delta).toBe(-30);
    expect("updateEvent" in detector).toBe(false);
  });

  it("stays informational only and does not expose recommendation, confidence, or wagering language", async () => {
    const moduleExports = await import("@/src/modules/market-snapshot-intake");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportedNames).toContain("moneylinemovementdetector");
    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("confidence");
    expect(exportedNames).not.toContain("guarantee");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
    expect(exportedNames).not.toContain("bet");
  });
});
