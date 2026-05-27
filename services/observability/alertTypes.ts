import type { ObservabilityAlertSeverity } from "./observabilitySeverity";
import type { ObservabilityAlert, ObservabilityAlertStatus } from "./observabilityTypes";

export type NumericAlertCondition = {
  kind: "numeric";
  metricName: string;
  comparator: "gt" | "gte";
  threshold: number;
};

export type StatusAlertCondition = {
  kind: "status";
  metricName: string;
  equals: string;
};

export type AlertCondition = NumericAlertCondition | StatusAlertCondition;

export type ObservabilityAlertRule = {
  ruleId: string;
  source: string;
  severity: ObservabilityAlertSeverity;
  condition: AlertCondition;
  reason: string;
  recommendedAction: string;
  defaultStatus?: ObservabilityAlertStatus;
};

export type EvaluatedAlert = ObservabilityAlert;
