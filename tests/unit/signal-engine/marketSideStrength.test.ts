import { describe, expect, it } from "vitest";
import { calculateMarketSideStrength, type VerifiedMovementEvent } from "@/services/signal-engine";

function event(overrides: Partial<VerifiedMovementEvent> = {}): VerifiedMovementEvent {
  return {
    event_id: "event-1",
    event_type: "spread_movement_event",
    market_id: "market-1",
    source_ids: ["source-a"],
    timestamp: "2026-06-05T13:00:00.000Z",
    verification_status: "VERIFIED",
    validation_record_id: "validation-1",
    schema_version: "1.2.0",
    evidence: {
      observations_used: ["obs-1"],
      movement_events_used: ["move-1"],
      evidence_summary: "summary",
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
    },
    ...overrides,
  };
}

describe("marketSideStrength", () => {
  it("calculates spread side strengthening correctly", () => {
    expect(calculateMarketSideStrength(event())).toMatchObject({
      market_side_strengthened: "Team B",
      movement_direction: "TOWARD_UNDERDOG",
    });
  });

  it("calculates moneyline side strengthening correctly", () => {
    expect(calculateMarketSideStrength(event({
      event_type: "moneyline_movement_event",
      payload: {
        previous_line: -140,
        new_line: -170,
        market_side_map: {
          listed_side: "Team A",
          opposing_side: "Team B",
        },
      },
    }))).toMatchObject({
      market_side_strengthened: "Team A",
      movement_direction: "PRICE_SHORTENING",
    });
  });

  it("calculates total side strengthening correctly", () => {
    expect(calculateMarketSideStrength(event({
      event_type: "totals_movement_event",
      payload: {
        previous_line: 221.5,
        new_line: 220,
        market_side_map: {
          over_side: "Over",
          under_side: "Under",
        },
      },
    }))).toMatchObject({
      market_side_strengthened: "Under",
      movement_direction: "TOWARD_UNDER",
    });
  });
});
