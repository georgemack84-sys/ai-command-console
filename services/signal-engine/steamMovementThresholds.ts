import type { SteamMovementThresholds } from "./types";

export const defaultSteamMovementThresholds: SteamMovementThresholds = Object.freeze({
  minimum_source_count: 2,
  minimum_movement_size: 1.0,
  maximum_time_window_seconds: 300,
  minimum_alignment_ratio: 0.75,
  fast_movement_per_minute: 0.2,
});

export function resolveSteamMovementThresholds(
  overrides: Partial<SteamMovementThresholds> = {},
): SteamMovementThresholds {
  return Object.freeze({
    ...defaultSteamMovementThresholds,
    ...overrides,
  });
}
