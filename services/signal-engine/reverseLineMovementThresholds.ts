import type { ReverseLineMovementThresholds } from "./types";

export const defaultReverseLineMovementThresholds: ReverseLineMovementThresholds = Object.freeze({
  minimum_public_percentage: 60,
  minimum_movement_size: 0.5,
  maximum_consensus_age_seconds: 900,
  require_verified_movement_event: true,
});

export function resolveReverseLineMovementThresholds(
  overrides: Partial<ReverseLineMovementThresholds> = {},
): ReverseLineMovementThresholds {
  return Object.freeze({
    ...defaultReverseLineMovementThresholds,
    ...overrides,
  });
}
