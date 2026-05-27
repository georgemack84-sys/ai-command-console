import type { ObservabilityAlert } from "./observabilityTypes";
import { maxObservabilitySeverity } from "./observabilitySeverity";
import { sortAlertsDeterministically } from "./alertSerialization";

function alertGroupKey(alert: ObservabilityAlert) {
  return [alert.tenantId || "__global__", alert.ruleId, alert.source, alert.correlationId].join(":");
}

export function deduplicateAlerts(alerts: ObservabilityAlert[]) {
  const grouped = new Map<string, ObservabilityAlert>();

  for (const alert of sortAlertsDeterministically(alerts)) {
    const key = alertGroupKey(alert);
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...alert });
      continue;
    }

    grouped.set(key, {
      ...existing,
      alertId: existing.alertId,
      severity: maxObservabilitySeverity(existing.severity, alert.severity),
      observedValue: compareValues(existing.observedValue, alert.observedValue) ? alert.observedValue : existing.observedValue,
      threshold: compareValues(existing.threshold, alert.threshold) ? alert.threshold : existing.threshold,
      triggeredAt: existing.triggeredAt >= alert.triggeredAt ? existing.triggeredAt : alert.triggeredAt,
      reason: existing.reason,
      recommendedAction: existing.recommendedAction,
    });
  }

  return sortAlertsDeterministically(Array.from(grouped.values()));
}

function compareValues(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number") {
    return right > left;
  }
  if (typeof left === "string" && typeof right === "string") {
    return right > left;
  }
  return false;
}
