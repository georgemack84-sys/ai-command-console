import type { ProposalApprovalBinding, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";
import { hashProposalIntegrityValue } from "./proposalHashEngine";

export function resolveProposalApprovalDependencies(
  input: ProposalIntegrityInput,
): ProposalApprovalBinding {
  return Object.freeze({
    approvalDependencyIds: Object.freeze([...input.recommendationLineageResult.approvalLineage.approvalDependencies]),
    approvalHash: hashProposalIntegrityValue("proposal-approval-binding", {
      approvalDependencies: input.recommendationLineageResult.approvalLineage.approvalDependencies,
      interventions: input.recommendationLineageResult.approvalLineage.operatorInterventions,
    }),
    approvalBound: input.recommendationLineageResult.approvalLineage.approvalDependencies.length > 0,
    interventionIds: Object.freeze([...input.recommendationLineageResult.approvalLineage.operatorInterventions]),
    deterministicHash: hashProposalIntegrityValue("proposal-approval-deterministic", {
      approvalDependencies: input.recommendationLineageResult.approvalLineage.approvalDependencies,
      interventionIds: input.recommendationLineageResult.approvalLineage.operatorInterventions,
    }),
  });
}
