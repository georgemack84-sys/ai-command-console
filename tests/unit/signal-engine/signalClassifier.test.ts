import { describe, expect, it } from "vitest";
import { classifySignal, type VerifiedMovementEvent } from "@/services/signal-engine";

function movementEvent(overrides: Partial<VerifiedMovementEvent> = {}): VerifiedMovementEvent {
  return {
    event_id: "event-1",
    event_type: "spread_movement_event",
    market_id: "market-1",
    source_ids: ["source-a", "source-b"],
    timestamp: "2026-06-05T13:00:00.000Z",
    verification_status: "VERIFIED",
    validation_record_id: "validation-1",
    schema_version: "1.2.0",
    evidence: {
      observations_used: ["observation-1"],
      movement_events_used: ["movement-1"],
      evidence_summary: "Verified movement evidence present.",
      required_evidence_present: true,
    },
    payload: {
      movement_size: 1.5,
    },
    ...overrides,
  };
}

describe("signalClassifier", () => {
  it("classifies supported informational signal types deterministically", () => {
    expect(classifySignal(movementEvent({ payload: { reverse_line_movement: true } }))).toMatchObject({
      status: "SIGNAL",
      signalType: "REVERSE_LINE_MOVEMENT",
    });
    expect(classifySignal(movementEvent({
      event_type: "spread_movement_event",
      payload: {
        previous_line: -4.5,
        new_line: -3.5,
        market_side_map: {
          favorite_side: "Team A",
          underdog_side: "Team B",
        },
        public_consensus_snapshot: {
          consensus_id: "consensus-1",
          market_id: "market-1",
          public_side: "Team A",
          public_percentage: 68,
          opposing_side: "Team B",
          opposing_percentage: 32,
          consensus_type: "BET_PERCENTAGE",
          source_id: "consensus-source",
          captured_at: "2026-06-05T12:55:00.000Z",
          verification_status: "VERIFIED",
          schema_version: "1.2.0",
        },
      },
    }))).toMatchObject({
      status: "SIGNAL",
      signalType: "REVERSE_LINE_MOVEMENT",
    });
    expect(classifySignal(movementEvent({
      event_type: "spread_movement_event",
      payload: {
        source_value_snapshots: [
          {
            snapshot_id: "a",
            market_id: "market-1",
            source_id: "source-a",
            market_type: "SPREAD",
            value: -5.5,
            timestamp: "2026-06-05T13:00:00.000Z",
            verification_status: "VERIFIED",
            freshness_status: "CURRENT",
            schema_version: "1.2.0",
          },
          {
            snapshot_id: "b",
            market_id: "market-1",
            source_id: "source-b",
            market_type: "SPREAD",
            value: -4.5,
            timestamp: "2026-06-05T13:00:00.000Z",
            verification_status: "VERIFIED",
            freshness_status: "CURRENT",
            schema_version: "1.2.0",
          },
        ],
      },
    }))).toMatchObject({
      status: "SIGNAL",
      signalType: "CONSENSUS_DIVERGENCE",
    });
    expect(classifySignal(movementEvent({
      event_type: "totals_movement_event",
      payload: {
        movement_history_window: {
          market_id: "market-1",
          market_type: "TOTAL",
          events: [
            { event_id: "e1", source_id: "source-a", previous_value: 221.5, new_value: 223.0, movement_size: 1.5, movement_direction: "UP", timestamp: "2026-06-05T12:56:00.000Z", verification_status: "VERIFIED" },
            { event_id: "e2", source_id: "source-b", previous_value: 223.0, new_value: 220.5, movement_size: 2.5, movement_direction: "DOWN", timestamp: "2026-06-05T12:58:00.000Z", verification_status: "VERIFIED" },
            { event_id: "e3", source_id: "source-a", previous_value: 220.5, new_value: 222.0, movement_size: 1.5, movement_direction: "UP", timestamp: "2026-06-05T13:00:00.000Z", verification_status: "VERIFIED" },
          ],
          window_start: "2026-06-05T12:56:00.000Z",
          window_end: "2026-06-05T13:00:00.000Z",
          schema_version: "1.2.0",
        },
      },
    }))).toMatchObject({
      status: "SIGNAL",
      signalType: "VOLATILITY_SPIKE",
    });
    expect(classifySignal(movementEvent({ payload: { consensus_divergence: true } }))).toMatchObject({
      status: "SIGNAL",
      signalType: "CONSENSUS_DIVERGENCE",
    });
    expect(classifySignal(movementEvent({ payload: { volatility_state: "VOLATILE" } }))).toMatchObject({
      status: "SIGNAL",
      signalType: "VOLATILITY_SPIKE",
    });
    expect(classifySignal(movementEvent({
      event_type: "odds_shift_event",
      payload: { implied_probability_delta: 0.03 },
    }))).toMatchObject({
      status: "SIGNAL",
      signalType: "IMPLIED_PROBABILITY_SHIFT",
    });
    expect(classifySignal(movementEvent({
      payload: {
        previous_values: [
          { source_id: "source-a", value: -4.5, timestamp: "2026-06-05T12:58:00.000Z" },
          { source_id: "source-b", value: -4.5, timestamp: "2026-06-05T12:58:30.000Z" },
        ],
        new_values: [
          { source_id: "source-a", value: -6.0, timestamp: "2026-06-05T13:00:00.000Z" },
          { source_id: "source-b", value: -6.0, timestamp: "2026-06-05T13:00:15.000Z" },
        ],
      },
    }))).toMatchObject({
      status: "SIGNAL",
      signalType: "STEAM_MOVEMENT",
    });
  });

  it("returns no signal for unclassified movement", () => {
    expect(classifySignal(movementEvent({
      source_ids: ["source-a"],
      payload: { force_unclassified: true },
    }))).toMatchObject({
      status: "NO_SIGNAL",
      signalType: "UNCLASSIFIED",
    });
  });
});
