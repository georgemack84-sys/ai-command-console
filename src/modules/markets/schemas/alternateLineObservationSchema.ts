import type { AlternateLineObservation } from "./marketObservationTypes";

export function isAlternateLineObservation(observation: { market_type?: unknown }): observation is AlternateLineObservation {
  return observation.market_type === "ALTERNATE_LINE";
}
