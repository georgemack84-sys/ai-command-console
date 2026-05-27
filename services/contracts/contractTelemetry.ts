type ScopedContractTelemetry = {
  tenantId: string;
  workspaceId?: string;
  value: number;
};

const contractTelemetry = new Map<string, ScopedContractTelemetry>();

function telemetryKey(key: string, tenantId = "__global__") {
  return `${tenantId}::${key}`;
}

export function resetContractTelemetry() {
  contractTelemetry.clear();
}

export function recordContractTelemetry(
  key: string,
  scope?: {
    tenantId?: string;
    workspaceId?: string;
  },
) {
  const tenantId = scope?.tenantId || "__global__";
  const current = contractTelemetry.get(telemetryKey(key, tenantId));
  contractTelemetry.set(telemetryKey(key, tenantId), {
    tenantId,
    workspaceId: scope?.workspaceId,
    value: (current?.value || 0) + 1,
  });
}

export function getContractTelemetrySnapshot(scope?: { tenantId?: string }) {
  const entries = Array.from(contractTelemetry.entries())
    .filter(([, value]) => !scope?.tenantId || value.tenantId === scope.tenantId)
    .map(([key, value]) => [key.split("::").slice(1).join("::"), value.value]);
  return Object.fromEntries(entries) as Record<string, number>;
}
