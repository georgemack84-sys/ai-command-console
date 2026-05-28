import type { ConfidenceRiskProfile, EscalationState } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "@/services/escalation/escalationHasher";

export function buildConfidenceRiskProfile(input: {
  coordinationId: string;
  confidenceScore: number;
  replayIntegrityScore: number;
  governanceAlignmentScore: number;
  approvalClarityScore: number;
  driftRiskScore: number;
  escalationState: EscalationState;
  frozen: boolean;
  paused: boolean;
  createdAt: string;
}): ConfidenceRiskProfile {
  const uncertaintyScore = Number((1 - input.confidenceScore).toFixed(4));
  return Object.freeze({
    profileId: hashEscalationCoordinationValue("confidence-risk-profile-id", {
      coordinationId: input.coordinationId,
      createdAt: input.createdAt,
    }),
    coordinationId: input.coordinationId,
    confidenceScore: input.confidenceScore,
    uncertaintyScore,
    replayIntegrityScore: input.replayIntegrityScore,
    governanceAlignmentScore: input.governanceAlignmentScore,
    approvalClarityScore: input.approvalClarityScore,
    driftRiskScore: input.driftRiskScore,
    escalationState: input.escalationState,
    frozen: input.frozen,
    paused: input.paused,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}
