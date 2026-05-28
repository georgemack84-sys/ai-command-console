import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import type { ConfidenceInspection } from "@/types/human-supremacy";
import { hashInterventionValue } from "@/services/human-supremacy/interventionHasher";

export function inspectConfidenceLineage(input: {
  coordinationId: string;
  escalationRecord: GovernanceAwareEscalationRecord;
}): ConfidenceInspection {
  return Object.freeze({
    confidenceLineageId: hashInterventionValue("confidence-lineage-inspection-id", {
      coordinationId: input.coordinationId,
      profileId: input.escalationRecord.confidenceProfile.profileId,
    }),
    coordinationId: input.coordinationId,
    confidenceScore: input.escalationRecord.confidenceProfile.confidenceScore,
    uncertaintyScore: input.escalationRecord.confidenceProfile.uncertaintyScore,
    driftRiskScore: input.escalationRecord.confidenceProfile.driftRiskScore,
    inspectionHash: hashInterventionValue("confidence-lineage-inspection", {
      coordinationId: input.coordinationId,
      confidenceScore: input.escalationRecord.confidenceProfile.confidenceScore,
      uncertaintyScore: input.escalationRecord.confidenceProfile.uncertaintyScore,
      driftRiskScore: input.escalationRecord.confidenceProfile.driftRiskScore,
    }),
  });
}
