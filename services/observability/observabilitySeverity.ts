export const OBSERVABILITY_ALERT_SEVERITIES = ["INFO", "WARNING", "HIGH", "CRITICAL", "EMERGENCY"] as const;

export type ObservabilityAlertSeverity = (typeof OBSERVABILITY_ALERT_SEVERITIES)[number];

const severityRank: Record<ObservabilityAlertSeverity, number> = {
  INFO: 0,
  WARNING: 1,
  HIGH: 2,
  CRITICAL: 3,
  EMERGENCY: 4,
};

export function compareObservabilitySeverity(
  left: ObservabilityAlertSeverity,
  right: ObservabilityAlertSeverity,
) {
  return severityRank[left] - severityRank[right];
}

export function maxObservabilitySeverity(
  left: ObservabilityAlertSeverity,
  right: ObservabilityAlertSeverity,
) {
  return compareObservabilitySeverity(left, right) >= 0 ? left : right;
}
