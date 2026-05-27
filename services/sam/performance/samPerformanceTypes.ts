export type SamDurationMetricName =
  | "sam.bridge.duration"
  | "sam.proposal.validation.duration"
  | "sam.idempotency.lookup.duration"
  | "sam.idempotency.write.duration"
  | "sam.audit.append.duration"
  | "sam.audit.dedupe.duration"
  | "sam.dryrun.duration"
  | "sam.queue.wait.duration"
  | "sam.lock.wait.duration"
  | "sam.chaos.scenario.duration"
  | "sam.stability.score.duration"
  | "sam.degraded.mode.duration";

export type SamGaugeMetricName =
  | "sam.queue.depth";

export type SamCounterMetricName =
  | "sam.retry.count"
  | "sam.backpressure.activations";

export type SamMetricName = SamDurationMetricName | SamGaugeMetricName | SamCounterMetricName;

export type SamDurationSummary = {
  count: number;
  totalMs: number;
  maxMs: number;
  lastMs: number;
};

export type SamPerformanceSnapshot = {
  durations: Partial<Record<SamDurationMetricName, SamDurationSummary>>;
  gauges: Partial<Record<SamGaugeMetricName, number>>;
  counters: Partial<Record<SamCounterMetricName, number>>;
};
