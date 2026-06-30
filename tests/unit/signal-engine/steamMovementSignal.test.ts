import { describe, expect, it } from "vitest";
import {
  createSignalEngine,
  evaluateSteamMovementSignal,
  type VerifiedMovementEvent,
} from "@/services/signal-engine";

function steamEvent(overrides: Partial<VerifiedMovementEvent> = {}): VerifiedMovementEvent {
  return {
    event_id: "steam-event-1",
    event_type: "spread_movement_event",
    market_id: "market-1",
    source_ids: ["source-a", "source-b", "source-c"],
    timestamp: "2026-06-05T13:00:30.000Z",
    verification_status: "VERIFIED",
    validation_record_id: "validation-1",
    schema_version: "1.2.0",
    evidence: {
      observations_used: ["observation-1", "observation-2"],
      movement_events_used: ["movement-1", "movement-2"],
      evidence_summary: "Verified market movement observed across sources.",
      required_evidence_present: true,
    },
    payload: {
      previous_values: [
        { source_id: "source-a", value: -4.5, timestamp: "2026-06-05T12:56:00.000Z" },
        { source_id: "source-b", value: -4.5, timestamp: "2026-06-05T12:56:30.000Z" },
        { source_id: "source-c", value: -4.5, timestamp: "2026-06-05T12:57:00.000Z" },
      ],
      new_values: [
        { source_id: "source-a", value: -6.0, timestamp: "2026-06-05T13:00:00.000Z" },
        { source_id: "source-b", value: -6.0, timestamp: "2026-06-05T13:00:15.000Z" },
        { source_id: "source-c", value: -6.0, timestamp: "2026-06-05T13:00:30.000Z" },
      ],
    },
    ...overrides,
  };
}

describe("steamMovementSignal", () => {
  it("creates spread steam when verified sources move toward the favorite inside threshold", () => {
    const result = evaluateSteamMovementSignal(steamEvent());
    expect(result).toMatchObject({
      status: "SIGNAL",
      evidence: {
        movement_direction: "TOWARD_FAVORITE",
        movement_size: 1.5,
        source_count: 3,
        source_alignment: {
          alignment_ratio: 1,
        },
      },
    });
  });

  it("creates total steam when totals move toward the over quickly", () => {
    const result = evaluateSteamMovementSignal(steamEvent({
      event_type: "totals_movement_event",
      payload: {
        previous_values: [
          { source_id: "source-a", value: 221.5, timestamp: "2026-06-05T12:57:00.000Z" },
          { source_id: "source-b", value: 221.5, timestamp: "2026-06-05T12:57:15.000Z" },
        ],
        new_values: [
          { source_id: "source-a", value: 223.0, timestamp: "2026-06-05T13:00:00.000Z" },
          { source_id: "source-b", value: 223.0, timestamp: "2026-06-05T13:00:20.000Z" },
        ],
      },
      source_ids: ["source-a", "source-b"],
    }));
    expect(result).toMatchObject({
      status: "SIGNAL",
      evidence: {
        movement_direction: "OVER",
      },
    });
  });

  it("creates moneyline steam when moneyline shortens quickly", () => {
    const result = evaluateSteamMovementSignal(steamEvent({
      event_type: "moneyline_movement_event",
      payload: {
        previous_values: [
          { source_id: "source-a", value: -140, timestamp: "2026-06-05T12:57:00.000Z" },
          { source_id: "source-b", value: -140, timestamp: "2026-06-05T12:57:20.000Z" },
        ],
        new_values: [
          { source_id: "source-a", value: -170, timestamp: "2026-06-05T12:59:30.000Z" },
          { source_id: "source-b", value: -170, timestamp: "2026-06-05T13:00:00.000Z" },
        ],
      },
      source_ids: ["source-a", "source-b"],
    }));
    expect(result).toMatchObject({
      status: "SIGNAL",
      evidence: {
        movement_direction: "SHORTENING",
      },
    });
  });

  it("returns no signal when movement is too slow", () => {
    const result = evaluateSteamMovementSignal(steamEvent({
      payload: {
        previous_values: [
          { source_id: "source-a", value: -4.5, timestamp: "2026-06-05T10:00:00.000Z" },
          { source_id: "source-b", value: -4.5, timestamp: "2026-06-05T10:05:00.000Z" },
        ],
        new_values: [
          { source_id: "source-a", value: -6.0, timestamp: "2026-06-05T13:00:00.000Z" },
          { source_id: "source-b", value: -6.0, timestamp: "2026-06-05T13:05:00.000Z" },
        ],
      },
      source_ids: ["source-a", "source-b"],
    }));
    expect(result).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Movement occurred outside the configured steam time window."],
    });
  });

  it("returns no signal when movement size is below threshold", () => {
    const result = evaluateSteamMovementSignal(steamEvent({
      payload: {
        previous_values: [
          { source_id: "source-a", value: -4.5, timestamp: "2026-06-05T12:58:00.000Z" },
          { source_id: "source-b", value: -4.5, timestamp: "2026-06-05T12:58:15.000Z" },
        ],
        new_values: [
          { source_id: "source-a", value: -5.0, timestamp: "2026-06-05T13:00:00.000Z" },
          { source_id: "source-b", value: -5.0, timestamp: "2026-06-05T13:00:15.000Z" },
        ],
      },
      source_ids: ["source-a", "source-b"],
    }));
    expect(result).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Movement size did not meet the steam threshold."],
    });
  });

  it("returns no signal when source alignment is below threshold", () => {
    const result = evaluateSteamMovementSignal(steamEvent({
      payload: {
        previous_values: [
          { source_id: "source-a", value: -4.5, timestamp: "2026-06-05T12:58:00.000Z" },
          { source_id: "source-b", value: -4.5, timestamp: "2026-06-05T12:58:15.000Z" },
          { source_id: "source-c", value: -4.5, timestamp: "2026-06-05T12:58:30.000Z" },
          { source_id: "source-d", value: -4.5, timestamp: "2026-06-05T12:58:45.000Z" },
        ],
        new_values: [
          { source_id: "source-a", value: -6.0, timestamp: "2026-06-05T13:00:00.000Z" },
          { source_id: "source-b", value: -6.0, timestamp: "2026-06-05T13:00:15.000Z" },
          { source_id: "source-c", value: -3.5, timestamp: "2026-06-05T13:00:20.000Z" },
          { source_id: "source-d", value: -3.5, timestamp: "2026-06-05T13:00:25.000Z" },
        ],
      },
      source_ids: ["source-a", "source-b", "source-c", "source-d"],
    }), { minimum_alignment_ratio: 0.75 });
    expect(result).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Verified sources did not align strongly enough for steam detection."],
    });
  });

  it("rejects missing required steam evidence and unverified events", () => {
    expect(evaluateSteamMovementSignal(steamEvent({ payload: {} }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "MISSING_EVIDENCE",
    });
    expect(evaluateSteamMovementSignal(steamEvent({ verification_status: "UNVERIFIED" }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "EVENT_NOT_VERIFIED",
    });
  });

  it("creates an informational-only steam signal with evidence chain and replay metadata", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:01:00.000Z") });
    const result = engine.processEvent(steamEvent());

    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "STEAM_MOVEMENT",
        risk_status: "INFORMATIONAL_ONLY",
        recommendation_generated: false,
        evidence_chain: {
          previous_values: expect.any(Array),
          new_values: expect.any(Array),
          source_count: 3,
          movement_direction: "TOWARD_FAVORITE",
          movement_size: 1.5,
          time_window: expect.any(Object),
          timestamps: expect.any(Array),
          movement_speed: expect.any(Object),
          source_alignment: expect.any(Object),
        },
        replay_reference: {
          replay_input: {
            movement_events: ["movement-1", "movement-2"],
            classifier_version: "steam-movement-classifier/v1",
          },
        },
      },
    });

    if (result.status !== "SIGNAL_CREATED") {
      throw new Error("expected signal");
    }
    expect(result.signal.explanation).toContain("Market pressure detected.");
    expect(result.signal.explanation).toContain("Multiple verified sources moved in the same direction.");
    expect(result.signal.explanation).toContain("Observation may indicate coordinated market activity.");
  });

  it("rejects blocked language through the explanation guardrail", () => {
    const engine = createSignalEngine({
      now: () => new Date("2026-06-05T13:01:00.000Z"),
      explanationBuilder: () => "Hammer this wager now.",
    });
    expect(engine.processEvent(steamEvent())).toMatchObject({
      status: "REJECTED",
      rejection_code: "RECOMMENDATION_LANGUAGE_BLOCKED",
    });
  });

  it("produces identical output for the same event and thresholds", () => {
    const left = evaluateSteamMovementSignal(steamEvent(), { minimum_alignment_ratio: 0.75 });
    const right = evaluateSteamMovementSignal(steamEvent(), { minimum_alignment_ratio: 0.75 });
    expect(left).toEqual(right);
  });
});
