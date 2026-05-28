import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function resolveGovernanceSnapshot(proposal: ProposalRecord): Readonly<{
  governanceSnapshotId: string;
  governanceSnapshotHash: string;
}> {
  return Object.freeze({
    governanceSnapshotId: hashContainmentValue("constitutional-governance-snapshot-id", {
      proposalId: proposal.proposalId,
      policySnapshotHash: proposal.governanceBinding.policySnapshotHash,
    }),
    governanceSnapshotHash: proposal.governanceBinding.policySnapshotHash,
  });
}
