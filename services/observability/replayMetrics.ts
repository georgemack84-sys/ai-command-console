const counters = new Map<string, number>();
const confidenceTotals = new Map<string, { total: number; count: number }>();

function key(metric: string, tenantId?: string | null) {
  return `${tenantId || "global"}:${metric}`;
}

export function recordReplayMetric(metric: string, tenantId?: string | null, increment = 1) {
  const metricKey = key(metric, tenantId);
  counters.set(metricKey, (counters.get(metricKey) || 0) + increment);
}

export function recordReplayConfidence(score: number, tenantId?: string | null) {
  const metricKey = key("replay_confidence_average", tenantId);
  const existing = confidenceTotals.get(metricKey) || { total: 0, count: 0 };
  confidenceTotals.set(metricKey, {
    total: existing.total + score,
    count: existing.count + 1,
  });
}

export function getReplayMetrics(tenantId?: string | null) {
  const prefix = `${tenantId || "global"}:`;
  const snapshot = Array.from(counters.entries()).reduce<Record<string, number>>((accumulator, [metricKey, value]) => {
    if (metricKey.startsWith(prefix)) {
      accumulator[metricKey.slice(prefix.length)] = value;
    }
    return accumulator;
  }, {});
  const confidenceEntry = confidenceTotals.get(`${prefix}replay_confidence_average`);
  if (confidenceEntry && confidenceEntry.count > 0) {
    snapshot.replay_confidence_average = confidenceEntry.total / confidenceEntry.count;
  }
  return snapshot;
}

export function resetReplayMetricsForTests() {
  counters.clear();
  confidenceTotals.clear();
}
