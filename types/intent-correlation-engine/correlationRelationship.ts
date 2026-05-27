import type { IntentCorrelationBoundary } from "./correlationBoundary";

export type CorrelationRelationshipKind =
  | "recommendation-related"
  | "governance-outcome-related"
  | "escalation-related"
  | "approval-related"
  | "confidence-trajectory-related"
  | "replay-lineage-related"
  | "evidence-context-related";

export type CorrelationStrength =
  | "weak"
  | "moderate"
  | "strong";

export type CorrelationGovernanceState =
  | "normal"
  | "review"
  | "restricted"
  | "blocked";

export type CorrelationValidationStatus =
  | "valid"
  | "rejected";

export interface IntentCorrelationRelationship {
  correlationId: string;
  sourceProposalId: string;
  targetProposalId: string;
  relationshipKind: CorrelationRelationshipKind;
  strength: CorrelationStrength;
  reasonCodes: readonly string[];
  governanceState: CorrelationGovernanceState;
  boundary: IntentCorrelationBoundary;
  replayBindingId: string;
  createdAt: string;
  correlationHash: string;
}
