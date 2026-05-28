import { normalizeDeterministicValue } from "../contracts/deterministicJson";
import type { ObservabilityAlert } from "./observabilityTypes";
import { compareObservabilitySeverity } from "./observabilitySeverity";

export function sortAlertsDeterministically(alerts: ObservabilityAlert[]) {
  return [...alerts].sort((left, right) => {
    const severity = compareObservabilitySeverity(right.severity, left.severity);
    if (severity !== 0) {
      return severity;
    }
    return (
      left.ruleId.localeCompare(right.ruleId)
      || String(left.tenantId || "").localeCompare(String(right.tenantId || ""))
      || left.source.localeCompare(right.source)
      || left.correlationId.localeCompare(right.correlationId)
      || left.alertId.localeCompare(right.alertId)
    );
  });
}

export function serializeAlert(alert: ObservabilityAlert) {
  return normalizeDeterministicValue(alert);
}
