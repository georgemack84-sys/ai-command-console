import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ProposalGovernanceBinding } from "@/types/proposal-lifecycle-engine";

export function bindProposalGovernance(governanceView: ConstitutionalGovernanceView): ProposalGovernanceBinding {
  const valid = governanceView.state === "ALLOW" && governanceView.errors.length === 0;
  return Object.freeze({
    governanceDecisionHash: governanceView.constitutionalDecisionHash,
    policySnapshotHash: governanceView.policy.policySnapshotHash,
    governanceLineageHash: governanceView.policy.governanceLineageHash,
    approvalLineageHash: governanceView.policy.approvalLineageHash,
    authorityLineageHash: governanceView.policy.authorityLineageHash,
    sourceState: governanceView.state,
    valid,
    disputed: governanceView.state !== "ALLOW",
  });
}
