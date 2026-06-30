import { describe, expect, it } from "vitest";
import {
  createSignalEngine,
  evaluateReverseLineMovementSignal,
  type VerifiedMovementEvent,
} from "@/services/signal-engine";

function reverseEvent(overrides: Partial<VerifiedMovementEvent> = {}): VerifiedMovementEvent {
  return {
    event_id: "reverse-event-1",
    event_type: "spread_movement_event",
    market_id: "market-1",
    source_ids: ["source-a", "source-b"],
    timestamp: "2026-06-05T13:00:00.000Z",
    verification_status: "VERIFIED",
    validation_record_id: "validation-1",
    schema_version: "1.2.0",
    evidence: {
      observations_used: ["obs-1", "obs-2"],
      movement_events_used: ["move-1"],
      evidence_summary: "Verified movement with public consensus attached.",
      required_evidence_present: true,
    },
    payload: {
      previous_line: -4.5,
      new_line: -3.5,
      market_side_map: {
        favorite_side: "Team A",
        underdog_side: "Team B",
        listed_side: "Team A",
        opposing_side: "Team B",
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
    ...overrides,
  };
}

describe("reverseLineMovementSignal", () => {
  it("creates reverse movement when public favors one side and the market strengthens the other", () => {
    const result = evaluateReverseLineMovementSignal(reverseEvent());
    expect(result).toMatchObject({
      status: "SIGNAL",
      evidence: {
        public_side: "Team A",
        market_side_strengthened: "Team B",
        movement_direction: "TOWARD_UNDERDOG",
      },
    });
  });

  it("creates moneyline reverse movement", () => {
    const result = evaluateReverseLineMovementSignal(reverseEvent({
      event_type: "moneyline_movement_event",
      payload: {
        previous_line: -150,
        new_line: -130,
        market_side_map: {
          listed_side: "Team A",
          opposing_side: "Team B",
        },
        public_consensus_snapshot: reverseEvent().payload.public_consensus_snapshot,
      },
    }));
    expect(result).toMatchObject({
      status: "SIGNAL",
      evidence: {
        market_side_strengthened: "Team B",
        movement_direction: "PRICE_LENGTHENING",
      },
    });
  });

  it("creates total reverse movement", () => {
    const result = evaluateReverseLineMovementSignal(reverseEvent({
      event_type: "totals_movement_event",
      payload: {
        previous_line: 221.5,
        new_line: 220.0,
        market_side_map: {
          over_side: "Over",
          under_side: "Under",
        },
        public_consensus_snapshot: {
          ...(reverseEvent().payload.public_consensus_snapshot as object),
          public_side: "Over",
          opposing_side: "Under",
        },
      },
    }));
    expect(result).toMatchObject({
      status: "SIGNAL",
      evidence: {
        market_side_strengthened: "Under",
        movement_direction: "TOWARD_UNDER",
      },
    });
  });

  it("returns no signal when public side and strengthened side match", () => {
    expect(evaluateReverseLineMovementSignal(reverseEvent({
      payload: {
        previous_line: -4.5,
        new_line: -6.0,
        market_side_map: {
          favorite_side: "Team A",
          underdog_side: "Team B",
        },
        public_consensus_snapshot: reverseEvent().payload.public_consensus_snapshot,
      },
    }))).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Market movement aligned with public consensus."],
    });
  });

  it("returns no signal when public percentage is below threshold", () => {
    expect(evaluateReverseLineMovementSignal(reverseEvent({
      payload: {
        ...reverseEvent().payload,
        public_consensus_snapshot: {
          ...(reverseEvent().payload.public_consensus_snapshot as object),
          public_percentage: 55,
          opposing_percentage: 45,
        },
      },
    }))).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Public consensus did not meet the reverse line movement threshold."],
    });
  });

  it("returns no signal when movement size is below threshold", () => {
    expect(evaluateReverseLineMovementSignal(reverseEvent({
      payload: {
        ...reverseEvent().payload,
        previous_line: -4.5,
        new_line: -4.2,
      },
    }))).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Movement size did not meet the reverse line movement threshold."],
    });
  });

  it("rejects invalid movement events and missing or invalid public consensus", () => {
    expect(evaluateReverseLineMovementSignal(reverseEvent({ verification_status: "UNVERIFIED" }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "EVENT_NOT_VERIFIED",
    });
    expect(evaluateReverseLineMovementSignal(reverseEvent({ payload: {} }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "MISSING_EVIDENCE",
    });
    expect(evaluateReverseLineMovementSignal(reverseEvent({
      payload: {
        ...reverseEvent().payload,
        public_consensus_snapshot: {
          ...(reverseEvent().payload.public_consensus_snapshot as object),
          verification_status: "INVALID",
        },
      },
    }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "MISSING_EVIDENCE",
    });
  });

  it("treats stale consensus as no signal based on the configured freshness threshold", () => {
    expect(evaluateReverseLineMovementSignal(reverseEvent({
      payload: {
        ...reverseEvent().payload,
        public_consensus_snapshot: {
          ...(reverseEvent().payload.public_consensus_snapshot as object),
          captured_at: "2026-06-05T12:00:00.000Z",
        },
      },
    }))).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Public consensus snapshot is too old for reverse line movement detection."],
    });
  });

  it("lowers confidence when consensus is limited", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:01:00.000Z") });
    const result = engine.processEvent(reverseEvent({
      payload: {
        ...reverseEvent().payload,
        public_consensus_snapshot: {
          ...(reverseEvent().payload.public_consensus_snapshot as object),
          verification_status: "LIMITED",
        },
      },
    }));
    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "REVERSE_LINE_MOVEMENT",
      },
    });
    if (result.status !== "SIGNAL_CREATED") throw new Error("expected signal");
    expect(result.signal.confidence_score.tier).not.toBe("HIGH");
  });

  it("creates an informational-only reverse line signal with evidence and replay metadata", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:01:00.000Z") });
    const result = engine.processEvent(reverseEvent());

    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "REVERSE_LINE_MOVEMENT",
        risk_status: "INFORMATIONAL_ONLY",
        recommendation_generated: false,
        evidence_chain: {
          public_side: "Team A",
          public_percentage: 68,
          market_side_strengthened: "Team B",
          previous_line: -4.5,
          new_line: -3.5,
          public_consensus_reference: expect.any(Object),
          comparison_result: expect.any(Object),
        },
        replay_reference: {
          replay_input: {
            classifier_version: "reverse-line-classifier/v1",
          },
        },
      },
    });
    if (result.status !== "SIGNAL_CREATED") throw new Error("expected signal");
    expect(result.signal.explanation).toContain("Reverse line movement detected.");
    expect(result.signal.explanation).toContain("Market movement diverges from public consensus.");
    expect(result.signal.explanation).toContain("Observation may indicate stronger market activity on the less popular side.");
  });

  it("rejects blocked reverse-line explanation language", () => {
    const engine = createSignalEngine({
      now: () => new Date("2026-06-05T13:01:00.000Z"),
      explanationBuilder: () => "Fade the public here.",
    });
    expect(engine.processEvent(reverseEvent())).toMatchObject({
      status: "REJECTED",
      rejection_code: "RECOMMENDATION_LANGUAGE_BLOCKED",
    });
  });

  it("produces identical output for the same input and thresholds", () => {
    expect(evaluateReverseLineMovementSignal(reverseEvent())).toEqual(
      evaluateReverseLineMovementSignal(reverseEvent()),
    );
  });
});
