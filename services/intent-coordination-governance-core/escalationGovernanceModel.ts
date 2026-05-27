import type { CoordinationBoundaryContract, CoordinationEscalationGovernance } from "@/types/intent-coordination-governance-core";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import { hashCoordinationGovernanceValue } from "./coordinationHasher";

export function deriveEscalationGovernanceModel(input: {
  escalation: ConstitutionalEscalationRecord;
  boundaryContract: CoordinationBoundaryContract;
  createdAt: string;
}): CoordinationEscalationGovernance {
  return Object.freeze({
    governanceId: hashCoordinationGovernanceValue("intent-coordination-escalation-governance-id", {
      escalationHash: input.escalation.escalationHash,
      createdAt: input.createdAt,
    }),
    escalationSeverity: input.escalation.recommendation.severity,
    recommendationType: input.escalation.recommendation.recommendationType,
    oversightOnly: true,
    executionAuthority: false,
    maxEscalationEdges: input.boundaryContract.maxEscalationEdges,
    maxEscalationDepth: input.boundaryContract.maxRelationshipDepth,
    overrideSupremacyRequired: true,
    createdAt: input.createdAt,
  });
}
