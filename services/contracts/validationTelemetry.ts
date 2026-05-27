const counters = new Map<string, number>();
const scopedCounters = new Map<string, number>();

function scopedKey(key: string, tenantId = "__global__") {
  return `${tenantId}::${key}`;
}

export function resetValidationTelemetry() {
  counters.clear();
  scopedCounters.clear();
}

export function recordValidationTelemetry(key: string, scope?: { tenantId?: string }) {
  counters.set(key, (counters.get(key) || 0) + 1);
  const tenantId = scope?.tenantId || "__global__";
  scopedCounters.set(scopedKey(key, tenantId), (scopedCounters.get(scopedKey(key, tenantId)) || 0) + 1);
}

export function getValidationTelemetrySnapshot(scope?: { tenantId?: string }) {
  if (!scope?.tenantId) {
    return Object.fromEntries(counters.entries()) as Record<string, number>;
  }
  const entries = Array.from(scopedCounters.entries())
    .filter(([key]) => key.startsWith(`${scope.tenantId}::`))
    .map(([key, value]) => [key.split("::").slice(1).join("::"), value]);
  return Object.fromEntries(entries) as Record<string, number>;
}
