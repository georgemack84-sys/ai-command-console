import type { VolatilitySpikeEvidence, VolatilitySpikeThresholds } from "./types";

export function classifyVolatilityState(
  movementCount: number,
  largestChange: number,
  directionChanges: number,
  movementsPerMinute: number,
  backAndForthDetected: boolean,
  thresholds: VolatilitySpikeThresholds,
): VolatilitySpikeEvidence["volatility_state"] {
  const spikeThresholdMet =
    movementCount >= thresholds.minimum_movement_count
    && (
      largestChange >= thresholds.minimum_largest_change
      || movementsPerMinute >= thresholds.minimum_movements_per_minute
      || directionChanges >= thresholds.minimum_direction_changes
    );

  if (!spikeThresholdMet) {
    const elevated =
      movementCount >= Math.max(2, thresholds.minimum_movement_count - 1)
      || largestChange >= thresholds.minimum_largest_change / 2
      || movementsPerMinute >= thresholds.minimum_movements_per_minute / 2;
    return elevated ? "ELEVATED" : "NONE";
  }

  const severe =
    largestChange >= thresholds.minimum_largest_change * thresholds.severe_spike_multiplier
    || movementsPerMinute >= thresholds.minimum_movements_per_minute * thresholds.severe_spike_multiplier
    || backAndForthDetected;
  return severe ? "SEVERE_SPIKE" : "SPIKE";
}
