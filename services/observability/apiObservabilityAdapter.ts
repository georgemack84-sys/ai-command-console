import { getApiMetricsSnapshot } from "../contracts/apiMetrics";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { ObservabilityMetric } from "./metricTypes";
import type { ObservabilitySourceStatus } from "./observabilityTypes";

function createMetric({
  name,
  value,
  status,
  generatedAt,
  tenantContext,
}: {
  name: ObservabilityMetric["name"];
  value: number;
  status?: ObservabilityMetric["status"];
  generatedAt: string;
  tenantContext?: TenantContext;
}): ObservabilityMetric {
  return {
    name,
    value,
    unit: "count",
    status: status || (value > 0 ? "WARNING" : "OK"),
    source: "api.metrics",
    measuredAt: generatedAt,
    component: "apiV1",
    tenantId: tenantContext?.tenantId,
    workspaceId: tenantContext?.workspaceId,
  };
}

export function buildApiObservabilitySnapshot({
  generatedAt,
  tenantContext,
}: {
  generatedAt: string;
  tenantContext?: TenantContext;
}) {
  const apiMetrics = getApiMetricsSnapshot(tenantContext);

  const metrics: Record<string, ObservabilityMetric> = {
    apiV1ValidationFailures: createMetric({
      name: "apiV1ValidationFailures",
      generatedAt,
      tenantContext,
      value: Object.entries(apiMetrics)
        .filter(([key]) => key.endsWith(".validation_failed"))
        .reduce((sum, [, value]) => sum + value, 0),
    }),
    degradedContractResponses: createMetric({
      name: "degradedContractResponses",
      generatedAt,
      tenantContext,
      value: Object.entries(apiMetrics)
        .filter(([key]) => key.endsWith(".degraded_response"))
        .reduce((sum, [, value]) => sum + value, 0),
    }),
    responseStabilityFailures: createMetric({
      name: "responseStabilityFailures",
      generatedAt,
      tenantContext,
      value: Object.entries(apiMetrics)
        .filter(([key]) => key.endsWith(".outbound_validation_failed") || key.endsWith(".response_stability_failed"))
        .reduce((sum, [, value]) => sum + value, 0),
      status: Object.entries(apiMetrics).some(([key, value]) =>
        (key.endsWith(".outbound_validation_failed") || key.endsWith(".response_stability_failed")) && value > 0)
        ? "CRITICAL"
        : "OK",
    }),
  };

  const sources: ObservabilitySourceStatus[] = [
    {
      name: "api.metrics",
      status: "AVAILABLE",
    },
  ];

  return {
    metrics,
    sources,
  };
}
