import { describe, expect, it } from "vitest";
import {
  createMovementVelocityTracker,
  type MovementVelocityInputEvent,
} from "@/src/modules/market-snapshot-intake";

function event(overrides: Partial<MovementVelocityInputEvent> = {}): MovementVelocityInputEvent {
  return {
    event_id: "event_1",
    event_type: "SPREAD_MOVEMENT",
    market_id: "market_1",
    source_id: "source_1",
    movement_size: 1,
    price_delta: null,
    implied_probability_delta: null,
    timestamp: "2026-06-05T12:30:00.000Z",
    detected_at: "2026-06-05T12:30:05.000Z",
    ...overrides,
  };
}

describe("EdgeBook Phase 1.1G movement velocity tracker", () => {
  it("returns unknown with fewer than two observations or invalid timestamps", () => {
    const tracker = createMovementVelocityTracker({ now: () => new Date("2026-06-05T12:45:00.000Z") });

    expect(tracker.recordEvent(event())).toMatchObject({
      status: "UNKNOWN",
      reason: "INSUFFICIENT_OBSERVATIONS",
      record: {
        velocity_state: "UNKNOWN",
        acceleration_state: "UNKNOWN",
        created_at: "2026-06-05T12:45:00.000Z",
      },
    });
    expect(tracker.recordEvent(event({
      event_id: "event_invalid",
      timestamp: "bad-timestamp",
      detected_at: "bad-detected",
    }))).toMatchObject({
      status: "UNKNOWN",
      reason: "INVALID_TIMESTAMP",
      record: {
        velocity_state: "UNKNOWN",
      },
    });
  });

  it("ignores non-movement event types and validates required identity fields", () => {
    const tracker = createMovementVelocityTracker();

    expect(tracker.recordEvent(event({ event_id: "", event_type: "SPREAD_MOVEMENT" }))).toMatchObject({
      status: "UNKNOWN",
      reason: "MISSING_EVENT_ID",
    });
    expect(tracker.recordEvent(event({ event_id: "event_2", event_type: "" }))).toMatchObject({
      status: "UNKNOWN",
      reason: "MISSING_EVENT_TYPE",
    });
    expect(tracker.recordEvent(event({ event_id: "event_3", event_type: "SNAPSHOT_READY" }))).toMatchObject({
      status: "UNKNOWN",
      reason: "NOT_MOVEMENT_EVENT",
    });
    expect(tracker.recordEvent(event({ event_id: "event_4", market_id: "" }))).toMatchObject({
      status: "UNKNOWN",
      reason: "MISSING_MARKET_ID",
    });
    expect(tracker.recordEvent(event({ event_id: "event_5", source_id: "" }))).toMatchObject({
      status: "UNKNOWN",
      reason: "MISSING_SOURCE_ID",
    });
  });

  it("groups events by market and source, sorts deterministically, and calculates metrics from movement_size first", () => {
    const tracker = createMovementVelocityTracker();
    tracker.recordEvent(event({
      event_id: "event_2",
      movement_size: 2,
      timestamp: "2026-06-05T12:31:00.000Z",
      detected_at: "2026-06-05T12:31:03.000Z",
    }));

    const result = tracker.recordEvent(event({
      event_id: "event_1",
      movement_size: 1,
      timestamp: "2026-06-05T12:30:00.000Z",
      detected_at: "2026-06-05T12:30:04.000Z",
    }));

    expect(result).toMatchObject({
      status: "RECORDED",
      record: {
        movement_count: 2,
        total_movement_size: 3,
        average_movement_size: 1.5,
        time_window_seconds: 60,
        average_seconds_between_moves: 60,
        velocity_score: 3,
        velocity_state: "VOLATILE",
        event_ids: ["event_1", "event_2"],
      },
    });
  });

  it("falls back to abs(price_delta) and abs(implied_probability_delta) when movement_size is missing", () => {
    const tracker = createMovementVelocityTracker();
    tracker.recordEvent(event({
      event_id: "event_price_1",
      movement_size: null,
      price_delta: -15,
      timestamp: "2026-06-05T12:30:00.000Z",
      detected_at: "2026-06-05T12:30:01.000Z",
    }));
    const priceResult = tracker.recordEvent(event({
      event_id: "event_price_2",
      movement_size: null,
      price_delta: 20,
      timestamp: "2026-06-05T12:31:00.000Z",
      detected_at: "2026-06-05T12:31:01.000Z",
    }));

    expect(priceResult).toMatchObject({
      status: "RECORDED",
      record: {
        total_movement_size: 35,
        average_movement_size: 17.5,
      },
    });

    const tracker2 = createMovementVelocityTracker();
    tracker2.recordEvent(event({
      event_id: "event_prob_1",
      movement_size: null,
      price_delta: null,
      implied_probability_delta: -0.02,
      timestamp: "2026-06-05T12:30:00.000Z",
      detected_at: "2026-06-05T12:30:01.000Z",
    }));
    const probResult = tracker2.recordEvent(event({
      event_id: "event_prob_2",
      movement_size: null,
      price_delta: null,
      implied_probability_delta: 0.03,
      timestamp: "2026-06-05T12:31:00.000Z",
      detected_at: "2026-06-05T12:31:01.000Z",
    }));

    expect(probResult).toMatchObject({
      status: "RECORDED",
      record: {
        total_movement_size: 0.05,
        average_movement_size: 0.025,
      },
    });
  });

  it("classifies slow, normal, fast, and volatile velocity states deterministically", () => {
    const slow = createMovementVelocityTracker();
    slow.recordEvent(event({ event_id: "slow_1", movement_size: 0.01, timestamp: "2026-06-05T12:30:00.000Z" }));
    expect(slow.recordEvent(event({ event_id: "slow_2", movement_size: 0.01, timestamp: "2026-06-05T12:31:00.000Z" }))).toMatchObject({
      status: "RECORDED",
      record: { velocity_state: "SLOW" },
    });

    const normal = createMovementVelocityTracker();
    normal.recordEvent(event({ event_id: "normal_1", movement_size: 0.2, timestamp: "2026-06-05T12:30:00.000Z" }));
    expect(normal.recordEvent(event({ event_id: "normal_2", movement_size: 0.2, timestamp: "2026-06-05T12:31:00.000Z" }))).toMatchObject({
      status: "RECORDED",
      record: { velocity_state: "NORMAL" },
    });

    const fast = createMovementVelocityTracker();
    fast.recordEvent(event({ event_id: "fast_1", movement_size: 0.4, timestamp: "2026-06-05T12:30:00.000Z" }));
    expect(fast.recordEvent(event({ event_id: "fast_2", movement_size: 0.4, timestamp: "2026-06-05T12:31:00.000Z" }))).toMatchObject({
      status: "RECORDED",
      record: { velocity_state: "FAST" },
    });

    const volatile = createMovementVelocityTracker();
    volatile.recordEvent(event({ event_id: "volatile_1", movement_size: 1, timestamp: "2026-06-05T12:30:00.000Z" }));
    expect(volatile.recordEvent(event({ event_id: "volatile_2", movement_size: 1, timestamp: "2026-06-05T12:31:00.000Z" }))).toMatchObject({
      status: "RECORDED",
      record: { velocity_state: "VOLATILE" },
    });
  });

  it("detects accelerating, decelerating, stable, and unknown acceleration states", () => {
    const accelerating = createMovementVelocityTracker();
    accelerating.recordEvent(event({ event_id: "acc_1", movement_size: 0.1, timestamp: "2026-06-05T12:30:00.000Z" }));
    accelerating.recordEvent(event({ event_id: "acc_2", movement_size: 0.1, timestamp: "2026-06-05T12:31:00.000Z" }));
    accelerating.recordEvent(event({ event_id: "acc_3", movement_size: 1, timestamp: "2026-06-05T12:31:30.000Z" }));
    expect(accelerating.recordEvent(event({ event_id: "acc_4", movement_size: 1, timestamp: "2026-06-05T12:32:00.000Z" }))).toMatchObject({
      status: "RECORDED",
      record: { acceleration_state: "ACCELERATING" },
    });

    const decelerating = createMovementVelocityTracker();
    decelerating.recordEvent(event({ event_id: "dec_1", movement_size: 1, timestamp: "2026-06-05T12:30:00.000Z" }));
    decelerating.recordEvent(event({ event_id: "dec_2", movement_size: 1, timestamp: "2026-06-05T12:31:00.000Z" }));
    decelerating.recordEvent(event({ event_id: "dec_3", movement_size: 0.1, timestamp: "2026-06-05T12:32:00.000Z" }));
    expect(decelerating.recordEvent(event({ event_id: "dec_4", movement_size: 0.1, timestamp: "2026-06-05T12:33:00.000Z" }))).toMatchObject({
      status: "RECORDED",
      record: { acceleration_state: "DECELERATING" },
    });

    const stable = createMovementVelocityTracker();
    stable.recordEvent(event({ event_id: "stable_1", movement_size: 0.5, timestamp: "2026-06-05T12:30:00.000Z" }));
    stable.recordEvent(event({ event_id: "stable_2", movement_size: 0.5, timestamp: "2026-06-05T12:31:00.000Z" }));
    stable.recordEvent(event({ event_id: "stable_3", movement_size: 0.5, timestamp: "2026-06-05T12:32:00.000Z" }));
    expect(stable.recordEvent(event({ event_id: "stable_4", movement_size: 0.75, timestamp: "2026-06-05T12:33:00.000Z" }))).toMatchObject({
      status: "RECORDED",
      record: { acceleration_state: "STABLE" },
    });
  });

  it("stores velocity records append-only, resolves duplicates idempotently, and preserves replayability", async () => {
    const tracker = createMovementVelocityTracker({ now: () => new Date("2026-06-05T12:45:00.000Z") });
    const first = tracker.recordEvent(event({ event_id: "replay_1", movement_size: 1, timestamp: "2026-06-05T12:30:00.000Z" }));
    const second = tracker.recordEvent(event({ event_id: "replay_2", movement_size: 2, timestamp: "2026-06-05T12:31:00.000Z" }));
    const duplicate = tracker.recordEvent(event({ event_id: "replay_2", movement_size: 2, timestamp: "2026-06-05T12:31:00.000Z" }));

    expect(first).toMatchObject({
      status: "UNKNOWN",
      duplicate: false,
    });
    expect(second).toMatchObject({
      status: "RECORDED",
      duplicate: false,
      record: {
        created_at: "2026-06-05T12:45:00.000Z",
        event_ids: ["replay_1", "replay_2"],
      },
    });
    expect(duplicate).toMatchObject({
      status: "RECORDED",
      duplicate: true,
    });
    expect(tracker.listVelocityRecords().length).toBeGreaterThanOrEqual(2);

    const listed = tracker.listVelocityRecords();
    listed[listed.length - 1].movement_count = 999;
    expect(tracker.listVelocityRecords()[tracker.listVelocityRecords().length - 1].movement_count).not.toBe(999);

    const replayTracker = createMovementVelocityTracker({ now: () => new Date("2026-06-05T12:45:00.000Z") });
    replayTracker.recordEvent(event({ event_id: "replay_1", movement_size: 1, timestamp: "2026-06-05T12:30:00.000Z" }));
    const replayResult = replayTracker.recordEvent(event({ event_id: "replay_2", movement_size: 2, timestamp: "2026-06-05T12:31:00.000Z" }));
    if (second.status !== "RECORDED" || replayResult.status !== "RECORDED") throw new Error("expected recorded");
    expect(replayResult.record.velocity_id).toBe(second.record.velocity_id);

    const moduleExports = await import("@/src/modules/market-snapshot-intake");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();
    expect(exportedNames).toContain("movementvelocitytracker");
    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("confidence");
    expect(exportedNames).not.toContain("guarantee");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
    expect(exportedNames).not.toContain("bet");
  });
});
