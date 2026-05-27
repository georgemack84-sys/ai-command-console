import type { IntentCorrelationBoundary } from "./correlationBoundary";

export interface ConfidenceLineagePoint {
  proposalId: string;
  confidenceProfileId: string;
  observedConfidence: number;
  observedAt: string;
  sourceReplayId: string;
}

export interface CorrelationConfidenceLineageGraph {
  graphId: string;
  points: readonly ConfidenceLineagePoint[];
  relationshipIds: readonly string[];
  boundary: IntentCorrelationBoundary;
  replayBindingId: string;
  graphHash: string;
}
