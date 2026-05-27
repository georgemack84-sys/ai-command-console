type ScopedMetric = {
  tenantId: string;
  workspaceId?: string;
  value: number;
};

const apiMetrics = new Map<string, ScopedMetric>();

function metricKey(key: string, tenantId = "__global__") {
  return `${tenantId}::${key}`;
}

export function resetApiMetrics() {
  apiMetrics.clear();
}

export function recordApiMetric(
  key: string,
  value = 1,
  scope?: {
    tenantId?: string;
    workspaceId?: string;
  },
) {
  const tenantId = scope?.tenantId || "__global__";
  const current = apiMetrics.get(metricKey(key, tenantId));
  apiMetrics.set(metricKey(key, tenantId), {
    tenantId,
    workspaceId: scope?.workspaceId,
    value: (current?.value || 0) + value,
  });
}

export function getApiMetricsSnapshot(scope?: { tenantId?: string }) {
  const entries = Array.from(apiMetrics.entries())
    .filter(([, value]) => !scope?.tenantId || value.tenantId === scope.tenantId)
    .map(([key, value]) => [key.split("::").slice(1).join("::"), value.value]);
  return Object.fromEntries(entries) as Record<string, number>;
}
