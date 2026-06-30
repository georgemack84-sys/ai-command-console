import { CURRENT_MARKET_OBSERVATION_SCHEMA_VERSION } from "../versioning/marketSchemaVersion";
import type { MarketObservation, RawMarketValues } from "../schemas/marketObservationTypes";

export const mockRawMarketValues: RawMarketValues = Object.freeze({
  raw_payload: Object.freeze({ mock: true, provider_market: "spread:-4.5" }),
  raw_line_value: "-4.5",
  raw_odds_value: "-110",
  raw_participant: "Mock Team",
  raw_market_name: "Mock Spread",
  received_at: "2026-06-04T12:00:00.000Z",
});

export function createMockMarketObservation(overrides: Partial<MarketObservation> = {}): MarketObservation {
  return {
    market_id: "market_1",
    sport: "basketball",
    league: "NBA",
    event_id: "event_1",
    market_type: "SPREAD",
    market_subtype: "FULL_GAME",
    participant: "Mock Team",
    line_value: -4.5,
    odds_value: -110,
    timestamp: "2026-06-04T12:00:00.000Z",
    source_id: "source_1",
    ownership_hash: "srcown_mock",
    schema_version: CURRENT_MARKET_OBSERVATION_SCHEMA_VERSION,
    raw_values: mockRawMarketValues,
    ...overrides,
  };
}
