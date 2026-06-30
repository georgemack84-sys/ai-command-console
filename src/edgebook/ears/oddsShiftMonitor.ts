import type { MarketObservation } from "../observations/marketObservationTypes";

export type OddsShiftType = "odds_compression" | "odds_expansion" | "stable";

export function classifyOddsShift(previous: MarketObservation, next: MarketObservation): OddsShiftType {
  const previousDistance = Math.abs(previous.odds_value);
  const nextDistance = Math.abs(next.odds_value);

  if (nextDistance < previousDistance) {
    return "odds_compression";
  }

  if (nextDistance > previousDistance) {
    return "odds_expansion";
  }

  return "stable";
}
