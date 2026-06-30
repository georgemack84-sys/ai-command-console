import { describe, expect, it } from "vitest";
import {
  createSignalEngine,
  evaluateVolatilitySpikeSignal,
  type VerifiedMovementEvent,
} from "@/services/signal-engine";

function volatilityEvent(overrides: Partial<VerifiedMovementEvent> = {}): VerifiedMovementEvent {
  return {
    event_id: "volatility-event-1",
    event_type: "totals_movement_event",
    market_id: "market-1",
    source_ids: ["source-a", "source-b"],
    timestamp: "2026-06-05T13:00:00.000Z",
    verification_status: "VERIFIED",
    validation_record_id: "validation-1",
    schema_version: "1.2.0",
    evidence: {
      observations_used: ["obs-1", "obs-2"],
      movement_events_used: ["move-1", "move-2", "move-3"],
      evidence_summary: "Verified movement history is present.",
      required_evidence_present: true,
    },
    payload: {
      movement_history_window: {
        market_id: "market-1",
        market_type: "TOTAL",
        events: [
          {
            event_id: "e1",
            source_id: "source-a",
            previous_value: 221.5,
            new_value: 223.0,
            movement_size: 1.5,
            movement_direction: "UP",
            timestamp: "2026-06-05T12:56:00.000Z",
            verification_status: "VERIFIED",
          },
          {
            event_id: "e2",
            source_id: "source-b",
            previous_value: 223.0,
            new_value: 220.5,
            movement_size: 2.5,
            movement_direction: "DOWN",
            timestamp: "2026-06-05T12:58:00.000Z",
            verification_status: "VERIFIED",
          },
          {
            event_id: "e3",
            source_id: "source-a",
            previous_value: 220.5,
            new_value: 222.0,
            movement_size: 1.5,
            movement_direction: "UP",
            timestamp: "2026-06-05T13:00:00.000Z",
            verification_status: "VERIFIED",
          },
        ],
        window_start: "2026-06-05T12:56:00.000Z",
        window_end: "2026-06-05T13:00:00.000Z",
        schema_version: "1.2.0",
      },
    },
    ...overrides,
  };
}

describe("volatilitySpikeSignal", () => {
  it("creates a volatility spike when totals reverse inside a short window", () => {
    expect(evaluateVolatilitySpikeSignal(volatilityEvent())).toMatchObject({
      status: "SIGNAL",
      evidence: {
        movement_count: 3,
        direction_changes: 2,
        volatility_state: "SEVERE_SPIKE",
      },
    });
  });

  it("creates a volatility spike for repeated spread changes", () => {
    expect(evaluateVolatilitySpikeSignal(volatilityEvent({
      event_type: "spread_movement_event",
      payload: {
        movement_history_window: {
          market_id: "market-1",
          market_type: "SPREAD",
          events: [
            { event_id: "e1", source_id: "source-a", previous_value: -4.5, new_value: -5.5, movement_size: 1, movement_direction: "DOWN", timestamp: "2026-06-05T12:54:00.000Z", verification_status: "VERIFIED" },
            { event_id: "e2", source_id: "source-b", previous_value: -5.5, new_value: -4.0, movement_size: 1.5, movement_direction: "UP", timestamp: "2026-06-05T12:57:00.000Z", verification_status: "VERIFIED" },
            { event_id: "e3", source_id: "source-a", previous_value: -4.0, new_value: -6.0, movement_size: 2, movement_direction: "DOWN", timestamp: "2026-06-05T13:00:00.000Z", verification_status: "VERIFIED" },
          ],
          window_start: "2026-06-05T12:54:00.000Z",
          window_end: "2026-06-05T13:00:00.000Z",
          schema_version: "1.2.0",
        },
      },
    }))).toMatchObject({
      status: "SIGNAL",
      evidence: {
        volatility_state: "SEVERE_SPIKE",
      },
    });
  });

  it("creates a volatility spike for repeated moneyline changes", () => {
    expect(evaluateVolatilitySpikeSignal(volatilityEvent({
      event_type: "moneyline_movement_event",
      payload: {
        movement_history_window: {
          market_id: "market-1",
          market_type: "MONEYLINE",
          events: [
            { event_id: "e1", source_id: "source-a", previous_value: -140, new_value: -170, movement_size: 30, movement_direction: "SHORTENING", timestamp: "2026-06-05T12:54:00.000Z", verification_status: "VERIFIED" },
            { event_id: "e2", source_id: "source-b", previous_value: -170, new_value: -130, movement_size: 40, movement_direction: "LENGTHENING", timestamp: "2026-06-05T12:57:00.000Z", verification_status: "VERIFIED" },
            { event_id: "e3", source_id: "source-a", previous_value: -130, new_value: -160, movement_size: 30, movement_direction: "SHORTENING", timestamp: "2026-06-05T13:00:00.000Z", verification_status: "VERIFIED" },
          ],
          window_start: "2026-06-05T12:54:00.000Z",
          window_end: "2026-06-05T13:00:00.000Z",
          schema_version: "1.2.0",
        },
      },
    }))).toMatchObject({
      status: "SIGNAL",
      evidence: {
        movement_count: 3,
      },
    });
  });

  it("returns no signal when movement count is low, outside the window, or too weak", () => {
    expect(evaluateVolatilitySpikeSignal(volatilityEvent({
      payload: {
        movement_history_window: {
          market_id: "market-1",
          market_type: "TOTAL",
          events: [
            { event_id: "e1", source_id: "source-a", previous_value: 221.5, new_value: 223.0, movement_size: 1.5, movement_direction: "UP", timestamp: "2026-06-05T12:56:00.000Z", verification_status: "VERIFIED" },
            { event_id: "e2", source_id: "source-b", previous_value: 223.0, new_value: 220.5, movement_size: 2.5, movement_direction: "DOWN", timestamp: "2026-06-05T12:58:00.000Z", verification_status: "VERIFIED" },
          ],
          window_start: "2026-06-05T12:56:00.000Z",
          window_end: "2026-06-05T12:58:00.000Z",
          schema_version: "1.2.0",
        },
      },
    }))).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Minimum movement count was not met."],
    });

    expect(evaluateVolatilitySpikeSignal(volatilityEvent({
      payload: {
        movement_history_window: {
          market_id: "market-1",
          market_type: "TOTAL",
          events: volatilityEvent().payload.movement_history_window.events,
          window_start: "2026-06-05T10:00:00.000Z",
          window_end: "2026-06-05T13:00:00.000Z",
          schema_version: "1.2.0",
        },
      },
    }))).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Movement occurred outside the configured volatility window."],
    });

    expect(evaluateVolatilitySpikeSignal(volatilityEvent({
      payload: {
        movement_history_window: {
          market_id: "market-1",
          market_type: "TOTAL",
          events: [
            { event_id: "e1", source_id: "source-a", previous_value: 221.5, new_value: 222.0, movement_size: 0.5, movement_direction: "UP", timestamp: "2026-06-05T12:50:00.000Z", verification_status: "VERIFIED" },
            { event_id: "e2", source_id: "source-b", previous_value: 222.0, new_value: 222.2, movement_size: 0.2, movement_direction: "UP", timestamp: "2026-06-05T12:55:00.000Z", verification_status: "VERIFIED" },
            { event_id: "e3", source_id: "source-a", previous_value: 222.2, new_value: 222.4, movement_size: 0.2, movement_direction: "UP", timestamp: "2026-06-05T13:00:00.000Z", verification_status: "VERIFIED" },
          ],
          window_start: "2026-06-05T12:50:00.000Z",
          window_end: "2026-06-05T13:00:00.000Z",
          schema_version: "1.2.0",
        },
      },
    }), {
      minimum_largest_change: 1,
      minimum_movements_per_minute: 0.5,
      minimum_direction_changes: 1,
    })).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Largest change, movement frequency, and direction-change thresholds were not met."],
    });
  });

  it("rejects missing or invalid movement history", () => {
    expect(evaluateVolatilitySpikeSignal(volatilityEvent({ payload: {} }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "MISSING_EVIDENCE",
    });
    expect(evaluateVolatilitySpikeSignal(volatilityEvent({
      payload: {
        movement_history_window: {
          market_id: "market-1",
          market_type: "TOTAL",
          events: [
            { event_id: "e1", source_id: "source-a", previous_value: 221.5, new_value: 223.0, movement_size: 1.5, movement_direction: "UP", timestamp: "2026-06-05T12:56:00.000Z", verification_status: "INVALID" },
          ],
          window_start: "2026-06-05T12:56:00.000Z",
          window_end: "2026-06-05T13:00:00.000Z",
          schema_version: "1.2.0",
        },
      },
    }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "MISSING_EVIDENCE",
    });
  });

  it("orders movement sequence, calculates largest change, and creates informational-only signal output", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:01:00.000Z") });
    const result = engine.processEvent(volatilityEvent());

    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "VOLATILITY_SPIKE",
        risk_status: "INFORMATIONAL_ONLY",
        recommendation_generated: false,
        evidence_chain: {
          movement_count: 3,
          movement_sequence: expect.any(Array),
          largest_change: {
            event_id: "e2",
            movement_size: 2.5,
          },
          direction_changes: 2,
          frequency_metrics: {
            movements_per_minute: 0.75,
          },
        },
        replay_reference: {
          replay_input: {
            classifier_version: "volatility-spike-classifier/v1",
          },
        },
      },
    });
    if (result.status !== "SIGNAL_CREATED") throw new Error("expected signal");
    expect(result.signal.explanation).toContain("Volatility spike detected.");
    expect(result.signal.explanation).toContain("Market volatility increased.");
    expect(result.signal.explanation).toContain("Observation may indicate uncertainty, breaking news, or unstable pricing.");
  });

  it("rejects blocked volatility language and remains deterministic", () => {
    const engine = createSignalEngine({
      now: () => new Date("2026-06-05T13:01:00.000Z"),
      explanationBuilder: () => "Exploit volatility before the line moves.",
    });
    expect(engine.processEvent(volatilityEvent())).toMatchObject({
      status: "REJECTED",
      rejection_code: "RECOMMENDATION_LANGUAGE_BLOCKED",
    });
    expect(evaluateVolatilitySpikeSignal(volatilityEvent())).toEqual(
      evaluateVolatilitySpikeSignal(volatilityEvent()),
    );
  });
});
