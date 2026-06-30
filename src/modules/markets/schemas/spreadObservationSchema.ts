import type { SpreadObservation } from "./marketObservationTypes";

export function isSpreadObservation(observation: { market_type?: unknown }): observation is SpreadObservation {
  return observation.market_type === "SPREAD";
}
