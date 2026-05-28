import type { CorrelationAuditEvent, CorrelationResult } from "@/types/intent-correlation-engine";
import { hashCorrelationValue } from "./correlationHasher";

export function buildCorrelationAuditEvents(input: {
  result: CorrelationResult;
  createdAt: string;
}) {
  const events: CorrelationAuditEvent[] = [];
  events.push(Object.freeze({
    eventId: hashCorrelationValue("intent-correlation-audit-created-id", { createdAt: input.createdAt, resultHash: input.result.resultHash }),
    eventType: input.result.status === "correlated" ? "correlation.created" : "correlation.rejected",
    timestamp: input.createdAt,
    eventHash: hashCorrelationValue("intent-correlation-audit-created-hash", { createdAt: input.createdAt, resultHash: input.result.resultHash }),
  }));
  for (const cluster of input.result.clusters) {
    events.push(Object.freeze({
      eventId: hashCorrelationValue("intent-correlation-audit-cluster-id", { clusterId: cluster.clusterId, createdAt: input.createdAt }),
      eventType: "cluster.created",
      clusterId: cluster.clusterId,
      timestamp: input.createdAt,
      eventHash: hashCorrelationValue("intent-correlation-audit-cluster-hash", cluster),
    }));
  }
  for (const binding of input.result.replayBindings) {
    events.push(Object.freeze({
      eventId: hashCorrelationValue("intent-correlation-audit-binding-id", { replayBindingId: binding.replayBindingId, createdAt: input.createdAt }),
      eventType: "replay-binding.created",
      replayBindingId: binding.replayBindingId,
      timestamp: input.createdAt,
      eventHash: hashCorrelationValue("intent-correlation-audit-binding-hash", binding),
    }));
  }
  return Object.freeze(events.sort((left, right) => left.eventId.localeCompare(right.eventId)));
}
