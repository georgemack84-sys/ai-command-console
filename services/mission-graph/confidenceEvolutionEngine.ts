import type { ConfidenceEvolution } from "@/types/mission-graph";
import type { ProposalFreshnessEvaluation } from "@/services/freshness/proposalFreshnessEngine";
import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import { hashMissionGraphValue } from "./graphHasher";

export function buildConfidenceEvolution(input: {
  coordinationId: string;
  freshnessEvaluation: ProposalFreshnessEvaluation;
  escalationRecord: GovernanceAwareEscalationRecord;
  createdAt: string;
}): readonly ConfidenceEvolution[] {
  const point = Object.freeze({
    pointId: hashMissionGraphValue("confidence-evolution-point", {
      coordinationId: input.coordinationId,
      createdAt: input.createdAt,
    }),
    confidenceScore: input.escalationRecord.confidenceProfile.confidenceScore,
    uncertaintyScore: input.escalationRecord.confidenceProfile.uncertaintyScore,
    escalationState: input.escalationRecord.decision.resultingState,
    freshnessStatus: input.freshnessEvaluation.state.freshnessStatus,
    createdAt: input.createdAt,
  });
  return Object.freeze([
    Object.freeze({
      evolutionId: hashMissionGraphValue("confidence-evolution", {
        coordinationId: input.coordinationId,
      }),
      coordinationId: input.coordinationId,
      points: Object.freeze([point]),
      replaySafe: true as const,
      createdAt: input.createdAt,
      evolutionHash: hashMissionGraphValue("confidence-evolution-hash", {
        coordinationId: input.coordinationId,
        point,
      }),
    }),
  ]);
}
