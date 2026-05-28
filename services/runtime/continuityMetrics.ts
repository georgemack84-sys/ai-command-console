const counters = new Map<string, number>();

function key(metric: string, tenantId?: string | null) {
  return `${tenantId || "global"}:${metric}`;
}

export function recordContinuityMetric(metric: string, tenantId?: string | null, increment = 1) {
  const metricKey = key(metric, tenantId);
  counters.set(metricKey, (counters.get(metricKey) || 0) + increment);
}

export function getContinuityMetrics(tenantId?: string | null) {
  const prefix = `${tenantId || "global"}:`;
  return Array.from(counters.entries()).reduce<Record<string, number>>((accumulator, [metricKey, value]) => {
    if (metricKey.startsWith(prefix)) {
      accumulator[metricKey.slice(prefix.length)] = value;
    }
    return accumulator;
  }, {});
}

export function resetContinuityMetricsForTests() {
  counters.clear();
}
