import type { MarketObservation } from "../../markets";
import { compareNumericMovement } from "./oddsMovementComparator";

export function compareMoneylineMovement(previous: Partial<MarketObservation>, next: Partial<MarketObservation>) {
  return compareNumericMovement(previous.odds_value, next.odds_value);
}
