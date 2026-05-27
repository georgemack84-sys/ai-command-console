import type {
  CorrelationAuditEvent,
  CorrelationReplayBinding,
  IntentCorrelationBoundary,
  IntentCorrelationError,
  IntentCorrelationRelationship,
  RecommendationCluster,
} from "@/types/intent-correlation-engine";
import { INTENT_CORRELATION_BOUNDARY } from "@/types/intent-correlation-engine";
import { createCorrelationError } from "./correlationErrors";

export const CORRELATION_RELATIONSHIP_KIND_PRIORITY = Object.freeze({
  "approval-related": 0,
  "confidence-trajectory-related": 1,
  "escalation-related": 2,
  "evidence-context-related": 3,
  "governance-outcome-related": 4,
  "recommendation-related": 5,
  "replay-lineage-related": 6,
} as const);

export function buildCorrelationBoundary(): IntentCorrelationBoundary {
  return INTENT_CORRELATION_BOUNDARY;
}

export function validateCorrelationTimestamp(timestamp: string, path: string): readonly IntentCorrelationError[] {
  return Object.freeze(
    !timestamp || Number.isNaN(Date.parse(timestamp))
      ? [createCorrelationError("PHASE_4_6B_CORRELATION_NON_DETERMINISTIC_OUTPUT", "Correlation timestamps must be immutable and valid.", path)]
      : [],
  );
}

export function validateCorrelationBoundary(boundary: IntentCorrelationBoundary): readonly IntentCorrelationError[] {
  const invalid = Object.entries(boundary).filter(([, value]) => value !== false);
  return Object.freeze(
    invalid.length === 0
      ? []
      : invalid.map(([key]) =>
        createCorrelationError("PHASE_4_6B_CORRELATION_CAPABILITY_EXPANSION_REJECTED", `Correlation boundary ${key} must remain false.`, `boundary.${key}`)),
  );
}

export function validateCorrelationRelationship(relationship: IntentCorrelationRelationship): readonly IntentCorrelationError[] {
  return Object.freeze([
    ...validateCorrelationBoundary(relationship.boundary),
    ...validateCorrelationTimestamp(relationship.createdAt, `relationships.${relationship.correlationId}.createdAt`),
  ]);
}

export function validateCorrelationCluster(cluster: RecommendationCluster): readonly IntentCorrelationError[] {
  return Object.freeze([
    ...validateCorrelationBoundary(cluster.boundary),
    ...validateCorrelationTimestamp(cluster.createdAt, `clusters.${cluster.clusterId}.createdAt`),
  ]);
}

export function validateCorrelationReplayBinding(binding: CorrelationReplayBinding): readonly IntentCorrelationError[] {
  return Object.freeze([
    ...validateCorrelationTimestamp(binding.createdAt, `replayBindings.${binding.replayBindingId}.createdAt`),
    ...(binding.sourceReplayIds.length === 0
      ? [createCorrelationError("PHASE_4_6B_CORRELATION_REPLAY_BINDING_MISSING", "Correlation replay binding requires original replay ids.", "sourceReplayIds")]
      : []),
  ]);
}

export function validateCorrelationAuditEvent(event: CorrelationAuditEvent): readonly IntentCorrelationError[] {
  return Object.freeze(validateCorrelationTimestamp(event.timestamp, `auditEvents.${event.eventId}.timestamp`));
}
