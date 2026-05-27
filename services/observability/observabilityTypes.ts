import type { ObservabilityAlertSeverity } from "./observabilitySeverity";

export const OBSERVABILITY_HEALTH_STATUSES = ["HEALTHY", "DEGRADED", "UNHEALTHY", "UNKNOWN"] as const;
export type ObservabilityHealthStatus = (typeof OBSERVABILITY_HEALTH_STATUSES)[number];

export const OBSERVABILITY_LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;
export type ObservabilityLogLevel = (typeof OBSERVABILITY_LOG_LEVELS)[number];

export const OBSERVABILITY_LOG_CATEGORIES = [
  "api",
  "contract",
  "sam",
  "recovery",
  "verification",
  "lock",
  "health",
  "alert",
  "telemetry",
] as const;
export type ObservabilityLogCategory = (typeof OBSERVABILITY_LOG_CATEGORIES)[number];

export const OBSERVABILITY_COMPONENTS = [
  "contracts",
  "apiV1",
  "sam",
  "recovery",
  "verification",
  "locks",
  "telemetry",
] as const;
export type ObservabilityComponentName = (typeof OBSERVABILITY_COMPONENTS)[number];

export type StructuredLogEvent = {
  eventId: string;
  timestamp: string;
  level: ObservabilityLogLevel;
  category: ObservabilityLogCategory;
  message: string;
  source: string;
  correlationId: string;
  tenantId?: string;
  workspaceId?: string;
  metadata: Record<string, unknown>;
};

export type ObservabilityComponentHealth = {
  name: ObservabilityComponentName;
  status: ObservabilityHealthStatus;
  summary: string;
  recommendedAction: string;
  signals: string[];
};

export type ObservabilityHealthSnapshot = {
  status: ObservabilityHealthStatus;
  generatedAt: string;
  components: ObservabilityComponentHealth[];
  summary: string;
  recommendedAction: string;
};

export type ObservabilitySourceStatus = {
  name: string;
  status: "AVAILABLE" | "DEGRADED" | "UNAVAILABLE";
  reason?: string;
};

export type ObservabilityAlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "SUPPRESSED";

export type ObservabilityAlert = {
  alertId: string;
  ruleId: string;
  severity: ObservabilityAlertSeverity;
  status: ObservabilityAlertStatus;
  reason: string;
  metricName: string;
  observedValue: number | string | boolean | null;
  threshold: number | string | boolean | null;
  triggeredAt: string;
  correlationId: string;
  source: string;
  recommendedAction: string;
  tenantId?: string;
  workspaceId?: string;
};
