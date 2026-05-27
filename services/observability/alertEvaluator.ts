import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { ObservabilityMetricSnapshot } from "./metricTypes";
import type { ObservabilityAlertRule } from "./alertTypes";
import type { ObservabilityAlert } from "./observabilityTypes";
import { deduplicateAlerts } from "./alertDeduplication";
import { registerDefaultAlertRules } from "./registerDefaultAlertRules";
import { buildMetricSnapshot } from "./metricSnapshot";

function matchesRule(rule: ObservabilityAlertRule, value: number | string | null) {
  if (rule.condition.kind === "numeric") {
    if (typeof value !== "number") {
      return false;
    }
    if (rule.condition.comparator === "gt") {
      return value > rule.condition.threshold;
    }
    return value >= rule.condition.threshold;
  }

  return String(value) === rule.condition.equals;
}

export function evaluateAlerts({
  rules,
  snapshot,
  generatedAt,
  tenantContext,
}: {
  rules: ObservabilityAlertRule[];
  snapshot: ObservabilityMetricSnapshot;
  generatedAt: string;
  tenantContext?: TenantContext;
}) {
  const alerts: ObservabilityAlert[] = [];

  for (const rule of rules) {
    const metric = snapshot.metrics.find((entry) => entry.name === rule.condition.metricName);
    const observedValue = metric?.value ?? null;
    if (!matchesRule(rule, observedValue)) {
      continue;
    }

    alerts.push({
      alertId: hashPayloadDeterministically({
        tenantId: tenantContext?.tenantId || metric?.tenantId || "__global__",
        ruleId: rule.ruleId,
        source: rule.source,
        correlationId: metric?.component || rule.source,
      }),
      ruleId: rule.ruleId,
      severity: rule.severity,
      status: rule.defaultStatus || "ACTIVE",
      reason: rule.reason,
      metricName: rule.condition.metricName,
      observedValue,
      threshold: rule.condition.kind === "numeric" ? rule.condition.threshold : rule.condition.equals,
      triggeredAt: generatedAt,
      correlationId: metric?.component || rule.source,
      source: rule.source,
      recommendedAction: rule.recommendedAction,
      tenantId: tenantContext?.tenantId || metric?.tenantId,
      workspaceId: tenantContext?.workspaceId || metric?.workspaceId,
    });
  }

  return deduplicateAlerts(alerts);
}

export async function evaluateCurrentAlerts({
  generatedAt,
  executionId,
  tenantContext,
}: {
  generatedAt?: string;
  executionId?: string;
  tenantContext?: TenantContext;
} = {}) {
  const now = generatedAt || new Date().toISOString();
  const snapshot = await buildMetricSnapshot({
    generatedAt: now,
    executionId,
    tenantContext,
  });
  return evaluateAlerts({
    rules: registerDefaultAlertRules(),
    snapshot,
    generatedAt: now,
    tenantContext,
  });
}
