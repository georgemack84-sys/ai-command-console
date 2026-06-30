import type { VolatilitySpikeThresholds } from "./types";

export const defaultVolatilitySpikeThresholds: VolatilitySpikeThresholds = Object.freeze({
  minimum_movement_count: 3,
  minimum_largest_change: 1.0,
  maximum_time_window_seconds: 600,
  minimum_direction_changes: 1,
  minimum_movements_per_minute: 0.3,
  severe_spike_multiplier: 2,
});

export function resolveVolatilitySpikeThresholds(
  overrides: Partial<VolatilitySpikeThresholds> = {},
): VolatilitySpikeThresholds {
  return Object.freeze({
    ...defaultVolatilitySpikeThresholds,
    ...overrides,
  });
}
