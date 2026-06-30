import type { MoneylineObservation } from "./marketObservationTypes";

export function isMoneylineObservation(observation: { market_type?: unknown }): observation is MoneylineObservation {
  return observation.market_type === "MONEYLINE";
}
