import type { IntentCorrelationBoundary } from "./correlationBoundary";

export interface ApprovalRelationshipObservation {
  observationId: string;
  sourceProposalId: string;
  targetProposalId: string;
  approvalIds: readonly string[];
  relationshipKind: "approval-related";
  approvalInheritance: false;
  boundary: IntentCorrelationBoundary;
  replayBindingId: string;
  observationHash: string;
}
