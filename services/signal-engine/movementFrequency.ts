import type { MovementFrequencyMetrics } from "./types";

function round(value: number): number {
  return Number(value.toFixed(4));
}

export function calculateMovementFrequency(
  movementCount: number,
  durationSeconds: number,
): MovementFrequencyMetrics {
  const safeDurationSeconds = Math.max(1, durationSeconds);
  const durationMinutes = safeDurationSeconds / 60;
  const movementsPerMinute = movementCount / durationMinutes;
  const averageSecondsBetweenMovements = safeDurationSeconds / Math.max(movementCount - 1, 1);
  const accelerationDetected = movementCount >= 4 && averageSecondsBetweenMovements <= 120;

  return Object.freeze({
    movement_count: movementCount,
    duration_seconds: safeDurationSeconds,
    movements_per_minute: round(movementsPerMinute),
    average_seconds_between_movements: round(averageSecondsBetweenMovements),
    acceleration_detected: accelerationDetected,
  });
}
