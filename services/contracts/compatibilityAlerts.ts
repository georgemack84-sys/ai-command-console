import { recordContractTelemetry } from "./contractTelemetry";

type CompatibilityAlertRecord = {
  tenantId: string;
  workspaceId?: string;
  message: string;
};

const alerts: CompatibilityAlertRecord[] = [];

export function recordCompatibilityAlert(
  message: string,
  scope?: {
    tenantId?: string;
    workspaceId?: string;
  },
) {
  recordContractTelemetry("compatibility_failure", scope);
  alerts.push({
    tenantId: scope?.tenantId || "__global__",
    workspaceId: scope?.workspaceId,
    message,
  });
}

export function resetCompatibilityAlerts() {
  alerts.length = 0;
}

export function getCompatibilityAlerts(scope?: { tenantId?: string }) {
  return alerts
    .filter((entry) => !scope?.tenantId || entry.tenantId === scope.tenantId)
    .map((entry) => entry.message);
}
