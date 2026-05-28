import type { EscalationState } from "@/types/escalation";
import type { ProposalFreshnessStatus } from "@/types/freshness";

export type ConfidenceEvolutionPoint = Readonly<{
  pointId: string;
  confidenceScore: number;
  uncertaintyScore: number;
  escalationState: EscalationState;
  freshnessStatus: ProposalFreshnessStatus;
  createdAt: string;
}>;

export type ConfidenceEvolution = Readonly<{
  evolutionId: string;
  coordinationId: string;
  points: readonly ConfidenceEvolutionPoint[];
  replaySafe: true;
  createdAt: string;
  evolutionHash: string;
}>;
