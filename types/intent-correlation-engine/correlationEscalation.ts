import type { IntentCorrelationBoundary } from "./correlationBoundary";
import type { CorrelationGovernanceState } from "./correlationRelationship";

export interface EscalationCorrelationGraph {
  graphId: string;
  proposalIds: readonly string[];
  escalationIds: readonly string[];
  relationshipIds: readonly string[];
  governanceState: CorrelationGovernanceState;
  boundary: IntentCorrelationBoundary;
  replayBindingId: string;
  graphHash: string;
}
