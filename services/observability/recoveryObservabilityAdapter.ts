import { buildRecoveryReadModel } from "../recovery/recoveryReadModel";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { ObservabilityMetric } from "./metricTypes";
import type { ObservabilitySourceStatus } from "./observabilityTypes";

function unknownMetric({
  name,
  component,
  generatedAt,
  tenantContext,
}: {
  name: ObservabilityMetric["name"];
  component: ObservabilityMetric["component"];
  generatedAt: string;
  tenantContext?: TenantContext;
}): ObservabilityMetric {
  return {
    name,
    value: null,
    unit: name === "lockContentionRate" ? "ratio" : "count",
    status: "UNKNOWN",
    source: "recovery.readModel",
    measuredAt: generatedAt,
    component,
    tenantId: tenantContext?.tenantId,
    workspaceId: tenantContext?.workspaceId,
  };
}

export async function buildRecoveryObservabilitySnapshot({
  generatedAt,
  executionId,
  tenantContext,
}: {
  generatedAt: string;
  executionId?: string;
  tenantContext?: TenantContext;
}) {
  if (!executionId) {
    return {
      metrics: {
        failedRecoveries: unknownMetric({ name: "failedRecoveries", component: "recovery", generatedAt, tenantContext }),
        verificationMismatches: unknownMetric({ name: "verificationMismatches", component: "verification", generatedAt, tenantContext }),
        lockContentionRate: unknownMetric({ name: "lockContentionRate", component: "locks", generatedAt, tenantContext }),
      },
      sources: [
        {
          name: "recovery.readModel",
          status: "UNAVAILABLE" as const,
          reason: "EXECUTION_ID_REQUIRED",
        },
      ] satisfies ObservabilitySourceStatus[],
    };
  }

  const result = await buildRecoveryReadModel({ executionId, tenantContext });
  if (!result.ok) {
    return {
      metrics: {
        failedRecoveries: unknownMetric({ name: "failedRecoveries", component: "recovery", generatedAt, tenantContext }),
        verificationMismatches: unknownMetric({ name: "verificationMismatches", component: "verification", generatedAt, tenantContext }),
        lockContentionRate: unknownMetric({ name: "lockContentionRate", component: "locks", generatedAt, tenantContext }),
      },
      sources: [
        {
          name: "recovery.readModel",
          status: "DEGRADED" as const,
          reason: result.error,
        },
      ] satisfies ObservabilitySourceStatus[],
    };
  }

  return {
    metrics: {
      failedRecoveries: {
        name: "failedRecoveries" as const,
        value: result.data.recovery.status === "failed" ? 1 : 0,
        unit: "count" as const,
        status: result.data.recovery.status === "failed" ? "CRITICAL" as const : "OK" as const,
        source: "recovery.readModel",
        measuredAt: generatedAt,
        component: "recovery" as const,
        tenantId: tenantContext?.tenantId,
        workspaceId: tenantContext?.workspaceId,
      },
      verificationMismatches: {
        name: "verificationMismatches" as const,
        value: result.data.verification.status === "failed" ? 1 : 0,
        unit: "count" as const,
        status: result.data.verification.status === "failed" ? "CRITICAL" as const : "OK" as const,
        source: "recovery.readModel",
        measuredAt: generatedAt,
        component: "verification" as const,
        tenantId: tenantContext?.tenantId,
        workspaceId: tenantContext?.workspaceId,
      },
      lockContentionRate: unknownMetric({ name: "lockContentionRate", component: "locks", generatedAt, tenantContext }),
    },
    sources: [
      {
        name: "recovery.readModel",
        status: "AVAILABLE" as const,
      },
    ] satisfies ObservabilitySourceStatus[],
  };
}
