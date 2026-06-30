import type { MarketObservation } from "../observations/marketObservationTypes";
import type { ChangeEvent, MovementDirection } from "./changeDetectionTypes";

function direction(delta: number): MovementDirection {
  if (delta > 0) return "UP";
  if (delta < 0) return "DOWN";
  return "FLAT";
}

export function detectMarketChange(
  previous: MarketObservation,
  next: MarketObservation,
): { status: "RECORDED"; event: ChangeEvent } | { status: "WAIT" } {
  const previousValue = previous.line_value ?? previous.odds_value;
  const nextValue = next.line_value ?? next.odds_value;
  const movementSize = Math.abs(nextValue - previousValue);
  const priceDelta = next.odds_value - previous.odds_value;

  if (movementSize === 0 && priceDelta === 0) {
    return { status: "WAIT" };
  }

  const elapsedSeconds = Math.max(1, (Date.parse(next.timestamp) - Date.parse(previous.timestamp)) / 1000);
  const changePercentage = previousValue === 0 ? 0 : movementSize / Math.abs(previousValue);

  return {
    status: "RECORDED",
    event: {
      change_event_id: `change_${previous.observation_id}_${next.observation_id}`,
      market_id: next.market_id,
      previous_value: previousValue,
      new_value: nextValue,
      movement_size: movementSize,
      movement_direction: direction(nextValue - previousValue),
      price_delta: priceDelta,
      velocity: movementSize / elapsedSeconds,
      frequency: 1,
      change_percentage: changePercentage,
      timestamp: next.timestamp,
      source_id: next.source_id,
      ownership_hash: next.ownership_hash,
    },
  };
}
