import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ConstitutionalGovernanceBinding } from "@/types/constitutional-coordination";
import { resolveGovernanceSnapshot } from "./governanceSnapshotResolver";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function bindGovernanceSnapshot(proposal: ProposalRecord, createdAt: string): ConstitutionalGovernanceBinding {
  const snapshot = resolveGovernanceSnapshot(proposal);
  const binding: ConstitutionalGovernanceBinding = Object.freeze({
    governanceSnapshotId: snapshot.governanceSnapshotId,
    governanceSnapshotHash: snapshot.governanceSnapshotHash,
    governanceLineageId: proposal.governanceBinding.governanceLineageHash,
    readinessHash: proposal.replayBinding.readinessHash,
    valid: proposal.governanceBinding.valid && !proposal.governanceBinding.disputed,
    createdAt,
    bindingHash: "",
  });
  return Object.freeze({
    ...binding,
    bindingHash: hashContainmentValue("constitutional-governance-binding", binding),
  });
}
