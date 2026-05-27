import type { TenantContext } from "../tenancy/tenantTypes";
import type { FailureClassification } from "./failureClassifier";
import type { FailureRecoveryMapping } from "./failureRecoveryMapping";

type CounterKey =
  | "classification.total"
  | "classification.disputed"
  | "classification.low_confidence"
  | "severity.catastrophic"
  | "mapping.blocked";

const counters = new Map<string, number>();

function scopeKey(name: string, tenantContext?: TenantContext | null) {
  return `${tenantContext?.tenantId || "global"}:${name}`;
}

export function recordFailureTelemetry({
  tenantContext,
  classification,
  mapping,
  event,
}: {
  tenantContext?: TenantContext | null;
  classification?: FailureClassification | null;
  mapping?: FailureRecoveryMapping | null;
  event: CounterKey;
}) {
  const key = scopeKey(event, tenantContext);
  counters.set(key, (counters.get(key) || 0) + 1);

  if (classification?.severity === "CATASTROPHIC") {
    const catastrophicKey = scopeKey("severity.catastrophic", tenantContext);
    counters.set(catastrophicKey, (counters.get(catastrophicKey) || 0) + 1);
  }
  if (mapping?.blocked) {
    const blockedKey = scopeKey("mapping.blocked", tenantContext);
    counters.set(blockedKey, (counters.get(blockedKey) || 0) + 1);
  }
}

export function getFailureTelemetrySnapshot(tenantContext?: TenantContext | null) {
  const prefix = `${tenantContext?.tenantId || "global"}:`;
  return Array.from(counters.entries())
    .filter(([key]) => key.startsWith(prefix))
    .reduce<Record<string, number>>((accumulator, [key, value]) => {
      accumulator[key.slice(prefix.length)] = value;
      return accumulator;
    }, {});
}

export function resetFailureTelemetryForTests() {
  counters.clear();
}
