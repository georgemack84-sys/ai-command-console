import type { MovementSpeedSummary, SteamMovementThresholds } from "./types";

function round(value: number): number {
  return Number(value.toFixed(4));
}

export function measureMovementSpeed(
  totalMovementSize: number,
  durationSeconds: number,
  thresholds: Pick<SteamMovementThresholds, "fast_movement_per_minute">,
): MovementSpeedSummary {
  const safeDurationSeconds = Math.max(1, durationSeconds);
  const durationMinutes = safeDurationSeconds / 60;
  const movementPerMinute = totalMovementSize / durationMinutes;
  const fastThreshold = thresholds.fast_movement_per_minute;

  let speedState: MovementSpeedSummary["speed_state"] = "SLOW";
  if (movementPerMinute >= fastThreshold * 2 || (safeDurationSeconds <= 60 && totalMovementSize >= 2)) {
    speedState = "SPIKE";
  } else if (movementPerMinute >= fastThreshold) {
    speedState = "FAST";
  } else if (movementPerMinute >= fastThreshold / 2) {
    speedState = "NORMAL";
  }

  return Object.freeze({
    total_movement_size: round(totalMovementSize),
    duration_seconds: safeDurationSeconds,
    movement_per_minute: round(movementPerMinute),
    speed_state: speedState,
  });
}
