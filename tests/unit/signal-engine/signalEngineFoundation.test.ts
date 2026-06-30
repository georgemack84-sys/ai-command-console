import { describe, expect, it } from "vitest";
import {
  createSignalEngine,
  createSignalRegistry,
  type SignalRegistry,
  type VerifiedMovementEvent,
} from "@/services/signal-engine";

function movementEvent(overrides: Partial<VerifiedMovementEvent> = {}): VerifiedMovementEvent {
  return {
    event_id: "event-1",
    event_type: "odds_shift_event",
    market_id: "market-1",
    source_ids: ["source-a", "source-b"],
    timestamp: "2026-06-05T13:00:00.000Z",
    verification_status: "VERIFIED",
    validation_record_id: "validation-1",
    schema_version: "1.2.0",
    evidence: {
      observations_used: ["observation-1"],
      movement_events_used: ["movement-1"],
      evidence_summary: "Verified source movement observed.",
      required_evidence_present: true,
    },
    payload: {
      implied_probability_delta: 0.03,
      movement_size: 1.2,
    },
    ...overrides,
  };
}

describe("signalEngineFoundation", () => {
  it("creates a signal for a verified event with evidence and replay metadata", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:05:00.000Z") });
    const result = engine.processEvent(movementEvent());

    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "IMPLIED_PROBABILITY_SHIFT",
        recommendation_generated: false,
        risk_status: "INFORMATIONAL_ONLY",
        evidence_chain: {
          required_evidence_present: true,
        },
        replay_reference: {
          input_event_id: "event-1",
          validation_record_id: "validation-1",
          registry_version: "signal-registry/v1",
          engine_version: "signal-engine/v1",
          schema_version: "1.2.0",
        },
        timestamp: "2026-06-05T13:05:00.000Z",
      },
    });
  });

  it("rejects invalid, limited, unverified, or evidence-free events", () => {
    const engine = createSignalEngine();

    expect(engine.processEvent(movementEvent({ event_id: "" }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "MISSING_REQUIRED_FIELD",
    });
    expect(engine.processEvent(movementEvent({ verification_status: "LIMITED" }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "EVENT_NOT_VERIFIED",
    });
    expect(engine.processEvent(movementEvent({
      evidence: {
        observations_used: [],
        movement_events_used: [],
        evidence_summary: "",
        required_evidence_present: false,
      },
    }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "MISSING_EVIDENCE",
    });
  });

  it("returns no signal for unclassified events", () => {
    const engine = createSignalEngine();
    const result = engine.processEvent(movementEvent({
      source_ids: ["source-a"],
      payload: { force_unclassified: true },
    }));

    expect(result).toEqual({
      status: "NO_SIGNAL",
      reason: "Event explicitly marked as unclassified.",
    });
  });

  it("rejects disabled and unknown registry signal types", () => {
    const disabledRegistry = createSignalRegistry({
      IMPLIED_PROBABILITY_SHIFT: {
        enabled: false,
      },
    });
    const disabledEngine = createSignalEngine({ registry: disabledRegistry });
    expect(disabledEngine.processEvent(movementEvent())).toMatchObject({
      status: "REJECTED",
      rejection_code: "SIGNAL_TYPE_DISABLED",
    });

    const engine = createSignalEngine({
      classifier: () => ({
        status: "SIGNAL",
        signalType: "NON_EXISTENT_SIGNAL" as never,
        reasons: ["forced unknown signal"],
      }),
    });
    expect(engine.processEvent(movementEvent())).toMatchObject({
      status: "REJECTED",
      rejection_code: "UNKNOWN_SIGNAL_TYPE",
    });
  });

  it("blocks recommendation language and replay-reference gaps", () => {
    const blockedLanguageEngine = createSignalEngine({
      explanationBuilder: () => "Bet this now.",
    });
    expect(blockedLanguageEngine.processEvent(movementEvent())).toMatchObject({
      status: "REJECTED",
      rejection_code: "RECOMMENDATION_LANGUAGE_BLOCKED",
    });

    const replayGapEngine = createSignalEngine();
    expect(replayGapEngine.processEvent(movementEvent({ validation_record_id: "" }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "REPLAY_REFERENCE_MISSING",
    });
  });

  it("is deterministic for the same input, registry version, and engine version", () => {
    const registry: SignalRegistry = createSignalRegistry();
    const engineA = createSignalEngine({
      now: () => new Date("2026-06-05T13:05:00.000Z"),
      registry,
    });
    const engineB = createSignalEngine({
      now: () => new Date("2026-06-05T13:05:00.000Z"),
      registry,
    });

    const left = engineA.processEvent(movementEvent());
    const right = engineB.processEvent(movementEvent());

    expect(left).toEqual(right);
    if (left.status !== "SIGNAL_CREATED") throw new Error("expected signal");
    expect(left.signal.explanation.toLowerCase()).not.toContain("bet");
    expect(left.signal.explanation.toLowerCase()).not.toContain("lock");
    expect(left.signal.explanation.toLowerCase()).not.toContain("guaranteed");
  });

  it("creates a steam movement signal with informational-only replay evidence", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:05:00.000Z") });
    const result = engine.processEvent(movementEvent({
      event_type: "spread_movement_event",
      payload: {
        previous_values: [
          { source_id: "source-a", value: -4.5, timestamp: "2026-06-05T12:58:00.000Z" },
          { source_id: "source-b", value: -4.5, timestamp: "2026-06-05T12:58:15.000Z" },
        ],
        new_values: [
          { source_id: "source-a", value: -6.0, timestamp: "2026-06-05T13:00:00.000Z" },
          { source_id: "source-b", value: -6.0, timestamp: "2026-06-05T13:00:15.000Z" },
        ],
      },
    }));

    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "STEAM_MOVEMENT",
        risk_status: "INFORMATIONAL_ONLY",
        recommendation_generated: false,
        replay_reference: {
          replay_input: {
            classifier_version: "steam-movement-classifier/v1",
          },
        },
      },
    });
  });

  it("creates a reverse line movement signal with informational-only replay evidence", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:05:00.000Z") });
    const result = engine.processEvent(movementEvent({
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
    }));

    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "REVERSE_LINE_MOVEMENT",
        risk_status: "INFORMATIONAL_ONLY",
        recommendation_generated: false,
        replay_reference: {
          replay_input: {
            classifier_version: "reverse-line-classifier/v1",
          },
        },
      },
    });
  });

  it("creates a consensus divergence signal with informational-only replay evidence", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:05:00.000Z") });
    const result = engine.processEvent(movementEvent({
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
    }));

    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "CONSENSUS_DIVERGENCE",
        risk_status: "INFORMATIONAL_ONLY",
        recommendation_generated: false,
        replay_reference: {
          replay_input: {
            classifier_version: "consensus-divergence-classifier/v1",
          },
        },
      },
    });
  });

  it("creates a volatility spike signal with informational-only replay evidence", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:05:00.000Z") });
    const result = engine.processEvent(movementEvent({
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
    }));

    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "VOLATILITY_SPIKE",
        risk_status: "INFORMATIONAL_ONLY",
        recommendation_generated: false,
        replay_reference: {
          replay_input: {
            classifier_version: "volatility-spike-classifier/v1",
          },
        },
      },
    });
  });
});
