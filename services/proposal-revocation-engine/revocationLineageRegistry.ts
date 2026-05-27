import { hashProposalRevocationValue } from "./proposalRevocationHasher";
import type { ProposalRevocationInput, ProposalRevocationInvalidationRecord, ProposalRevocationLineage } from "./proposalRevocationTypes";

export function appendRevocationLineage(input: {
  revocationId: string;
  existing?: ProposalRevocationLineage;
  request: ProposalRevocationInput["request"];
  invalidations: readonly ProposalRevocationInvalidationRecord[];
  governanceBindingId: string;
}): ProposalRevocationLineage {
  const revokedDependencyIds = input.invalidations.filter((item) => item.category === "dependency").map((item) => item.targetId);
  const revokedApprovalIds = input.invalidations.filter((item) => item.category === "approval").map((item) => item.targetId);
  const invalidatedReplayIds = input.invalidations.filter((item) => item.category === "replay").map((item) => item.targetId);
  const affectedGovernanceBindingIds = [
    ...input.invalidations.filter((item) => item.category === "governance").map((item) => item.targetId),
    input.governanceBindingId,
  ];

  const record = {
    revocationId: input.revocationId,
    proposalId: input.request.proposalId,
    sourceRevocationId: input.existing?.revocationId,
    cascadeRootProposalId: input.existing?.cascadeRootProposalId ?? input.request.proposalId,
    revokedDependencyIds,
    revokedApprovalIds,
    invalidatedReplayIds,
    affectedGovernanceBindingIds,
    revocationReason: input.request.revocationReason,
    revocationDepth: (input.existing?.revocationDepth ?? 0) + 1,
    previousLineageHash: input.existing?.lineageHash,
  };

  return Object.freeze({
    ...record,
    lineageHash: hashProposalRevocationValue("proposal-revocation-lineage", record),
  });
}
