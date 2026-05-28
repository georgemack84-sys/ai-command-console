import type { ExpandedConstitutionalAuditRecord, GovernanceReasoning } from "../../types/audit";
import type { GovernanceDisputeRecord } from "./disputeTracking";

export function buildOperatorAuditView(input: {
  record: ExpandedConstitutionalAuditRecord;
  reasoning: GovernanceReasoning;
  disputes: GovernanceDisputeRecord[];
}) {
  return {
    auditId: input.record.auditId,
    governanceAction: input.record.governanceAction,
    explanation: input.reasoning.explanation,
    disputes: input.disputes.map((dispute) => ({
      disputeId: dispute.disputeId,
      state: dispute.state,
      category: dispute.category,
    })),
    operatorVisibility: input.record.operatorVisibility,
  };
}
