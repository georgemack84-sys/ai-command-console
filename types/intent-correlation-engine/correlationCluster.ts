import type { IntentCorrelationBoundary } from "./correlationBoundary";
import type { CorrelationGovernanceState } from "./correlationRelationship";

export interface RecommendationCluster {
  clusterId: string;
  proposalIds: readonly string[];
  relationshipIds: readonly string[];
  clusterReasonCodes: readonly string[];
  governanceState: CorrelationGovernanceState;
  boundary: IntentCorrelationBoundary;
  replayBindingId: string;
  clusterHash: string;
  createdAt: string;
}
