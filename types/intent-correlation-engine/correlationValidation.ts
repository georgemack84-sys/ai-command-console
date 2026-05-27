import type { IntentCorrelationBoundary } from "./correlationBoundary";
import type { IntentCorrelationRelationship } from "./correlationRelationship";
import type { RecommendationCluster } from "./correlationCluster";
import type { CorrelationConfidenceLineageGraph } from "./correlationConfidence";
import type { EscalationCorrelationGraph } from "./correlationEscalation";
import type { ApprovalRelationshipObservation } from "./correlationApproval";
import type { CorrelationReplayBinding } from "./correlationReplay";

export interface CorrelationAuditEvent {
  eventId: string;
  eventType:
    | "correlation.created"
    | "correlation.rejected"
    | "cluster.created"
    | "confidence-lineage.bound"
    | "escalation-correlation.bound"
    | "approval-relationship.observed"
    | "replay-binding.created"
    | "boundary.violation.detected";
  correlationId?: string;
  clusterId?: string;
  replayBindingId?: string;
  timestamp: string;
  eventHash: string;
}

export interface CorrelationResult {
  status: "correlated" | "rejected";
  relationships: readonly IntentCorrelationRelationship[];
  clusters: readonly RecommendationCluster[];
  confidenceLineageGraphs: readonly CorrelationConfidenceLineageGraph[];
  escalationCorrelationGraphs: readonly EscalationCorrelationGraph[];
  approvalObservations: readonly ApprovalRelationshipObservation[];
  replayBindings: readonly CorrelationReplayBinding[];
  auditEvents: readonly CorrelationAuditEvent[];
  boundary: IntentCorrelationBoundary;
  resultHash: string;
}
