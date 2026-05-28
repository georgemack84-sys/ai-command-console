import type {
  SamCounterMetricName,
  SamDurationMetricName,
  SamDurationSummary,
  SamGaugeMetricName,
  SamPerformanceSnapshot,
} from "./samPerformanceTypes";

const durationState = new Map<SamDurationMetricName, SamDurationSummary>();
const gaugeState = new Map<SamGaugeMetricName, number>();
const counterState = new Map<SamCounterMetricName, number>();

export function resetSamPerformanceMetrics() {
  durationState.clear();
  gaugeState.clear();
  counterState.clear();
}

export function recordSamDuration(name: SamDurationMetricName, durationMs: number) {
  const normalized = Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : 0;
  const current = durationState.get(name) || {
    count: 0,
    totalMs: 0,
    maxMs: 0,
    lastMs: 0,
  };
  current.count += 1;
  current.totalMs += normalized;
  current.maxMs = Math.max(current.maxMs, normalized);
  current.lastMs = normalized;
  durationState.set(name, current);
}

export function setSamGauge(name: SamGaugeMetricName, value: number) {
  gaugeState.set(name, Number.isFinite(value) ? value : 0);
}

export function incrementSamCounter(name: SamCounterMetricName, by = 1) {
  counterState.set(name, (counterState.get(name) || 0) + by);
}

export function getSamPerformanceSnapshot(): SamPerformanceSnapshot {
  return {
    durations: Object.fromEntries(durationState.entries()) as SamPerformanceSnapshot["durations"],
    gauges: Object.fromEntries(gaugeState.entries()) as SamPerformanceSnapshot["gauges"],
    counters: Object.fromEntries(counterState.entries()) as SamPerformanceSnapshot["counters"],
  };
}
