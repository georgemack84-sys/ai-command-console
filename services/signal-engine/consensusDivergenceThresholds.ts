import type { ConsensusDivergenceThresholds } from "./types";

export const defaultConsensusDivergenceThresholds: ConsensusDivergenceThresholds = Object.freeze({
  minimum_source_count: 2,
  spread_divergence_threshold: 1.0,
  total_divergence_threshold: 1.0,
  moneyline_divergence_threshold: 20,
  maximum_snapshot_age_seconds: 600,
  severe_divergence_multiplier: 2,
});

export function resolveConsensusDivergenceThresholds(
  overrides: Partial<ConsensusDivergenceThresholds> = {},
): ConsensusDivergenceThresholds {
  return Object.freeze({
    ...defaultConsensusDivergenceThresholds,
    ...overrides,
  });
}
