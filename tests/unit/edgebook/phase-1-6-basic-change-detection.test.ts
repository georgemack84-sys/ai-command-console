import { describe, expect, it } from "vitest";
import {
  calculateMovementDirection,
  calculateMovementSize,
  createChangeDetectionEvent,
  createChangeDetectionPair,
  createMarketComparisonKey,
  detectMarketChange,
  rejectProhibitedChangeDetectionOutput,
} from "@/src/modules/change-detection";

describe("EdgeBook Phase 1.6 basic change detection", () => {
  it("detects spread movement", () => {
    const pair = createChangeDetectionPair({ line_value: -4.5 }, { line_value: -5.5 });
    expect(detectMarketChange(pair)).toMatchObject({
      status: "CHANGE_DETECTED",
      change: { previous_value: -4.5, new_value: -5.5, movement_size: 1, movement_direction: "DOWN" },
    });
  });

  it("detects totals movement", () => {
    const pair = createChangeDetectionPair(
      { market_type: "TOTALS", participant: "OVER", line_value: 221.5 },
      { market_type: "TOTALS", participant: "OVER", line_value: 223 },
    );
    expect(detectMarketChange(pair)).toMatchObject({
      status: "CHANGE_DETECTED",
      change: { previous_value: 221.5, new_value: 223, movement_size: 1.5, movement_direction: "UP" },
    });
  });

  it("detects moneyline movement", () => {
    const pair = createChangeDetectionPair(
      { market_type: "MONEYLINE", line_value: null, odds_value: -140 },
      { market_type: "MONEYLINE", line_value: null, odds_value: -170 },
    );
    expect(detectMarketChange(pair)).toMatchObject({
      status: "CHANGE_DETECTED",
      change: { previous_value: -140, new_value: -170, movement_size: 30, movement_direction: "DOWN" },
    });
  });

  it("detects odds movement", () => {
    const pair = createChangeDetectionPair({ odds_value: 120 }, { odds_value: 105 });
    expect(detectMarketChange({ ...pair, compareOddsOnly: true })).toMatchObject({
      status: "CHANGE_DETECTED",
      change: { previous_value: 120, new_value: 105, movement_size: 15, movement_direction: "DOWN" },
    });
  });

  it("detects player prop movement", () => {
    const pair = createChangeDetectionPair(
      { market_type: "PLAYER_PROP", participant: "lebron_james", market_subtype: "POINTS", line_value: 25.5 },
      { market_type: "PLAYER_PROP", participant: "lebron_james", market_subtype: "POINTS", line_value: 27.5 },
    );
    expect(detectMarketChange(pair)).toMatchObject({
      status: "CHANGE_DETECTED",
      change: { movement_size: 2, movement_direction: "UP" },
    });
  });

  it("detects alternate line movement", () => {
    const pair = createChangeDetectionPair(
      { market_type: "ALTERNATE_LINE", market_subtype: "ALT_SPREAD", line_value: -7.5 },
      { market_type: "ALTERNATE_LINE", market_subtype: "ALT_SPREAD", line_value: -8.5 },
    );
    expect(detectMarketChange(pair)).toMatchObject({
      status: "CHANGE_DETECTED",
      change: { movement_size: 1, movement_direction: "DOWN" },
    });
  });

  it("calculates movement size correctly", () => {
    expect(calculateMovementSize(-4.5, -5.5)).toBe(1);
  });

  it("calculates movement direction UP", () => {
    expect(calculateMovementDirection(1, 2)).toBe("UP");
  });

  it("calculates movement direction DOWN", () => {
    expect(calculateMovementDirection(2, 1)).toBe("DOWN");
  });

  it("calculates movement direction UNCHANGED", () => {
    expect(calculateMovementDirection(2, 2)).toBe("UNCHANGED");
  });

  it("returns UNKNOWN for null comparison", () => {
    expect(calculateMovementDirection(null, 2)).toBe("UNKNOWN");
  });

  it("creates NO_BASELINE status when no previous observation exists", () => {
    expect(detectMarketChange({ next: createChangeDetectionPair().next })).toMatchObject({
      status: "NO_BASELINE",
      failure: { reason: "NO_PREVIOUS_OBSERVATION" },
    });
  });

  it("records missing previous value failure", () => {
    const pair = createChangeDetectionPair({ line_value: null }, { line_value: -5.5 });
    expect(detectMarketChange(pair)).toMatchObject({ status: "COMPARISON_FAILED", failure: { reason: "MISSING_PREVIOUS_VALUE" } });
  });

  it("records missing new value failure", () => {
    const pair = createChangeDetectionPair({ line_value: -4.5 }, { line_value: null });
    expect(detectMarketChange(pair)).toMatchObject({ status: "COMPARISON_FAILED", failure: { reason: "MISSING_NEW_VALUE" } });
  });

  it("records missing source_id failure", () => {
    const pair = createChangeDetectionPair({}, { source_id: "" });
    expect(detectMarketChange(pair)).toMatchObject({ status: "COMPARISON_FAILED", failure: { reason: "MISSING_SOURCE_ID" } });
  });

  it("records missing market_id failure", () => {
    const pair = createChangeDetectionPair({}, { market_id: "" });
    expect(detectMarketChange(pair)).toMatchObject({ status: "COMPARISON_FAILED", failure: { reason: "MISSING_MARKET_ID" } });
  });

  it("records missing ownership_hash failure", () => {
    const pair = createChangeDetectionPair({}, { ownership_hash: "" });
    expect(detectMarketChange(pair)).toMatchObject({ status: "COMPARISON_FAILED", failure: { reason: "MISSING_OWNERSHIP_HASH" } });
  });

  it("records invalid market type failure", () => {
    const pair = createChangeDetectionPair({}, { market_type: "UNKNOWN" as never });
    expect(detectMarketChange(pair)).toMatchObject({ status: "COMPARISON_FAILED", failure: { reason: "INVALID_MARKET_TYPE" } });
  });

  it("makes comparison failure observable", () => {
    const pair = createChangeDetectionPair({ participant: "A" }, { participant: "B" });
    const result = detectMarketChange(pair);
    expect(result).toMatchObject({ status: "COMPARISON_FAILED", failure: { reason: "COMPARISON_NOT_ALLOWED" } });
    expect(result.events.map((event) => event.event_type)).toContain("CHANGE_FAILURE_RECORDED");
  });

  it("change record includes required references", () => {
    const pair = createChangeDetectionPair({ line_value: -4.5 }, { line_value: -5.5 });
    expect(detectMarketChange(pair)).toMatchObject({
      change: {
        timestamp: "2026-06-04T12:05:00.000Z",
        source_id: "source_1",
        market_id: "market_1",
        ownership_hash: "own_change",
      },
    });
  });

  it("comparison key generation is deterministic", () => {
    const observation = createChangeDetectionPair().next;
    expect(createMarketComparisonKey(observation)).toEqual(createMarketComparisonKey(observation));
  });

  it("change capture is reproducible", () => {
    const pair = createChangeDetectionPair({ line_value: -4.5 }, { line_value: -5.5 });
    expect(detectMarketChange(pair)).toEqual(detectMarketChange(pair));
  });
});

describe("EdgeBook Phase 1.6 change detection boundaries", () => {
  for (const field of [
    "prediction",
    "pick",
    "confidence_score",
    "edge_score",
    "expected_value",
    "recommendation",
    "implied_probability",
    "sharp_action",
    "wager_instruction",
  ]) {
    it(`rejects ${field}`, () => {
      expect(rejectProhibitedChangeDetectionOutput({ [field]: "blocked" })).toMatchObject({ status: "REJECTED" });
    });
  }

  it("change detection events do not trigger betting action", () => {
    const event = createChangeDetectionEvent({
      change_id: "change_1",
      event_type: "MARKET_CHANGE_DETECTED",
      reason: "Market movement detected.",
    });
    expect(Object.keys(event).join(" ").toLowerCase()).not.toContain("bet");
  });

  it("silent failures are recorded", () => {
    const result = detectMarketChange({ next: createChangeDetectionPair().next });
    expect(result.events.map((event) => event.event_type)).toContain("CHANGE_FAILURE_RECORDED");
  });

  it("change detection layer exposes no wager logic", async () => {
    const moduleExports = await import("@/src/modules/change-detection");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("prediction");
    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("edgescore");
  });
});
