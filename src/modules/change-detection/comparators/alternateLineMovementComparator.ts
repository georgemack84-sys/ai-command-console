import type { MarketObservation } from "../../markets";
import { compareNumericMovement } from "./oddsMovementComparator";

export function compareAlternateLineMovement(previous: Partial<MarketObservation>, next: Partial<MarketObservation>) {
  return compareNumericMovement(previous.line_value, next.line_value);
}
