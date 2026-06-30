import type { TotalsObservation } from "./marketObservationTypes";

export function isTotalsObservation(observation: { market_type?: unknown }): observation is TotalsObservation {
  return observation.market_type === "TOTALS";
}
