import type { ObservabilityComponentName, ObservabilityHealthStatus, ObservabilitySourceStatus } from "./observabilityTypes";

export const OBSERVABILITY_METRIC_STATUSES = ["OK", "WARNING", "CRITICAL", "UNKNOWN"] as const;
export type ObservabilityMetricStatus = (typeof OBSERVABILITY_METRIC_STATUSES)[number];

export const REQUIRED_OBSERVABILITY_METRICS = [
  "failedRecoveries",
  "lockContentionRate",
  "verificationMismatches",
  "systemHealthStatus",
  "contractValidationFailures",
  "contractCompatibilityFailures",
  "replayValidationFailures",
  "readinessGateFailures",
  "degradedContractResponses",
  "apiV1ValidationFailures",
] as const;

export type RequiredObservabilityMetricName = (typeof REQUIRED_OBSERVABILITY_METRICS)[number];

export type ObservabilityMetricName =
  | RequiredObservabilityMetricName
  | "strictModeRejections"
  | "unknownFieldRejections"
  | "governancePolicyFailures"
  | "schemaStabilityViolations"
  | "apiV1OutboundValidationFailures"
  | "responseStabilityFailures"
  | "samQueueDepth"
  | "samRetryCount"
  | "samDryRunGenerated"
  | "samBridgeBlocked"
  | "samBackpressureActivations"
  | "degradedModeActivations";

export type ObservabilityMetricUnit = "count" | "ratio" | "status" | "ms";

export type ObservabilityMetric = {
  name: ObservabilityMetricName;
  value: number | string | null;
  unit: ObservabilityMetricUnit;
  status: ObservabilityMetricStatus;
  source: string;
  measuredAt: string;
  component: ObservabilityComponentName;
  tenantId?: string;
  workspaceId?: string;
};

export type ObservabilityMetricSnapshot = {
  snapshotId: string;
  generatedAt: string;
  healthStatus: ObservabilityHealthStatus;
  metrics: ObservabilityMetric[];
  sources: ObservabilitySourceStatus[];
  degradedSignals: string[];
  unknownSignals: string[];
};
