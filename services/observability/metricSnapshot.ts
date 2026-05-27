import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { TenantContext } from "../tenancy/tenantTypes";
import { buildIsolationCoverageSnapshot } from "../security/isolationCoverage";
import { buildApiObservabilitySnapshot } from "./apiObservabilityAdapter";
import { buildContractObservabilitySnapshot } from "./contractObservabilityAdapter";
import { getMetricDefinition } from "./metricRegistry";
import { buildRecoveryObservabilitySnapshot } from "./recoveryObservabilityAdapter";
import { buildSamObservabilitySnapshot } from "./samObservabilityAdapter";
import { buildSystemHealthSnapshot } from "./systemHealth";
import type { ObservabilityMetric, ObservabilityMetricSnapshot } from "./metricTypes";
import type { ObservabilitySourceStatus } from "./observabilityTypes";

function sortMetrics(metrics: ObservabilityMetric[]) {
  return [...metrics].sort((left, right) => left.name.localeCompare(right.name) || left.source.localeCompare(right.source));
}

export async function buildMetricSnapshot({
  generatedAt,
  executionId,
  tenantContext,
}: {
  generatedAt?: string;
  executionId?: string;
  tenantContext?: TenantContext;
} = {}): Promise<ObservabilityMetricSnapshot> {
  const now = generatedAt || new Date().toISOString();
  const contract = buildContractObservabilitySnapshot({ generatedAt: now, tenantContext });
  const api = buildApiObservabilitySnapshot({ generatedAt: now, tenantContext });
  const sam = buildSamObservabilitySnapshot({ generatedAt: now, tenantContext });
  const recovery = await buildRecoveryObservabilitySnapshot({ generatedAt: now, executionId, tenantContext });

  const metrics = sortMetrics([
    ...Object.values(contract.metrics),
    ...Object.values(api.metrics),
    ...Object.values(sam.metrics),
    ...Object.values(recovery.metrics),
  ]);

  const health = buildSystemHealthSnapshot({
    generatedAt: now,
    metrics,
  });

  const systemMetric: ObservabilityMetric = {
    name: "systemHealthStatus",
    value: health.status,
    unit: "status",
    status:
      health.status === "UNHEALTHY"
        ? "CRITICAL"
        : health.status === "DEGRADED"
          ? "WARNING"
          : health.status === "UNKNOWN"
            ? "UNKNOWN"
            : "OK",
    source: "health",
    measuredAt: now,
    component: "telemetry",
    tenantId: tenantContext?.tenantId,
    workspaceId: tenantContext?.workspaceId,
  };

  const finalMetrics = sortMetrics([...metrics, systemMetric]);
  const degradedSignals = finalMetrics.filter((metric) => metric.status === "WARNING" || metric.status === "CRITICAL").map((metric) => metric.name);
  const unknownSignals = finalMetrics.filter((metric) => metric.status === "UNKNOWN").map((metric) => metric.name);

  const sources: ObservabilitySourceStatus[] = [
    ...contract.sources,
    ...api.sources,
    ...sam.sources,
    ...recovery.sources,
    {
      name: "tenant.isolation",
      status: "AVAILABLE",
      reason: buildIsolationCoverageSnapshot({
        executionState: "persistence_enforced",
        locks: "persistence_enforced",
        contracts: "boundary_enforced",
        sam: "boundary_enforced",
        observability: "boundary_enforced",
        recovery: executionId ? "boundary_enforced" : "degraded",
      }).overall,
    },
  ];

  return {
    snapshotId: hashPayloadDeterministically({
      tenantId: tenantContext?.tenantId || null,
      workspaceId: tenantContext?.workspaceId || null,
      generatedAt: now,
      executionId: executionId || null,
      metrics: finalMetrics.map((metric) => ({
        name: metric.name,
        value: metric.value,
        status: metric.status,
      })),
    }),
    generatedAt: now,
    healthStatus: health.status,
    metrics: finalMetrics.map((metric) => {
      const definition = getMetricDefinition(metric.name);
      return definition ? { ...metric, unit: definition.unit } : metric;
    }),
    sources,
    degradedSignals,
    unknownSignals,
  };
}
