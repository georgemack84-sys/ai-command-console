import { getSamPerformanceSnapshot } from "../sam/performance/samPerformanceMetrics";
import { getSamQueueMetrics } from "../sam/performance/samQueueMetrics";
import { getSamThroughputSnapshot } from "../sam/performance/samThroughputTracker";
import { getSamQueueGovernorSnapshot } from "../sam/scaling/samQueueGovernor";
import { determineSamDegradedMode } from "../sam/scaling/samDegradedMode";
import { loadSamRuntimeLimits } from "../sam/scaling/samRuntimeLimits";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { ObservabilityMetric } from "./metricTypes";
import type { ObservabilitySourceStatus } from "./observabilityTypes";

function countMetric({
  name,
  value,
  generatedAt,
  status,
  tenantContext,
}: {
  name: ObservabilityMetric["name"];
  value: number;
  generatedAt: string;
  status?: ObservabilityMetric["status"];
  tenantContext?: TenantContext;
}): ObservabilityMetric {
  return {
    name,
    value,
    unit: "count",
    status: status || (value > 0 ? "WARNING" : "OK"),
    source: "sam.runtime",
    measuredAt: generatedAt,
    component: "sam",
    tenantId: tenantContext?.tenantId,
    workspaceId: tenantContext?.workspaceId,
  };
}

export function buildSamObservabilitySnapshot({
  generatedAt,
  tenantContext,
}: {
  generatedAt: string;
  tenantContext?: TenantContext;
}) {
  const queueGovernor = getSamQueueGovernorSnapshot();
  const performance = getSamPerformanceSnapshot();
  const throughput = getSamThroughputSnapshot();
  const queueMetrics = getSamQueueMetrics();
  const mode = determineSamDegradedMode({
    ...queueGovernor,
    limits: loadSamRuntimeLimits(),
  });

  const metrics: Record<string, ObservabilityMetric> = {
    samQueueDepth: countMetric({
      name: "samQueueDepth",
      value: queueMetrics.queueDepth,
      generatedAt,
      status: queueMetrics.queueDepth > 0 ? "WARNING" : "OK",
      tenantContext,
    }),
    samRetryCount: countMetric({
      name: "samRetryCount",
      value: performance.counters["sam.retry.count"] || 0,
      generatedAt,
      tenantContext,
    }),
    samDryRunGenerated: countMetric({
      name: "samDryRunGenerated",
      value: throughput.byKind.dryrun_generated || 0,
      generatedAt,
      status: "OK",
      tenantContext,
    }),
    samBridgeBlocked: countMetric({
      name: "samBridgeBlocked",
      value: throughput.byKind.bridge_blocked || 0,
      generatedAt,
      tenantContext,
    }),
    samBackpressureActivations: countMetric({
      name: "samBackpressureActivations",
      value: performance.counters["sam.backpressure.activations"] || 0,
      generatedAt,
      tenantContext,
    }),
    degradedModeActivations: countMetric({
      name: "degradedModeActivations",
      value: mode === "NORMAL" ? 0 : 1,
      generatedAt,
      status: mode === "NORMAL" ? "OK" : mode === "ELEVATED" || mode === "THROTTLED" ? "WARNING" : "CRITICAL",
      tenantContext,
    }),
  };

  const sources: ObservabilitySourceStatus[] = [
    {
      name: "sam.runtime",
      status: "AVAILABLE",
    },
  ];

  return {
    metrics,
    sources,
    degradedMode: mode,
  };
}
