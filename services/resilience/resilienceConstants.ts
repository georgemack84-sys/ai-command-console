export const DEFAULT_RESILIENCE_THRESHOLDS = {
  freezeThreshold: 0.78,
  containmentThreshold: 0.62,
  escalationThreshold: 0.55,
  collapseThreshold: 0.82,
  disputedThreshold: 0.45,
  staleViewMs: 5 * 60 * 1000,
} as const;
