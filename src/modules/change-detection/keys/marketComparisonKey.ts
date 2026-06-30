import { isNonEmptyString } from "../../../core";
import type { MarketObservation } from "../../markets";

export function createMarketComparisonKey(
  observation: Partial<MarketObservation>,
): { status: "CREATED"; key: string } | { status: "FAILED"; reason: string } {
  for (const field of ["source_id", "market_id", "market_type", "market_subtype", "participant"] as const) {
    if (!isNonEmptyString(observation[field])) {
      return { status: "FAILED", reason: `${field} is required for comparison key` };
    }
  }

  return {
    status: "CREATED",
    key: JSON.stringify({
      event_id: observation.event_id,
      league: observation.league,
      market_id: observation.market_id,
      market_subtype: observation.market_subtype,
      market_type: observation.market_type,
      participant: observation.participant,
      source_id: observation.source_id,
      sport: observation.sport,
    }),
  };
}
