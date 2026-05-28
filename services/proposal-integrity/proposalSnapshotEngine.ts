import type { OperationalProposal } from "./operationalProposal";
import type { ProposalSnapshot } from "./proposalIntegrityStateTypes";
import { hashProposalIntegrityValue } from "./proposalHashEngine";

export function buildProposalSnapshot(proposal: OperationalProposal): ProposalSnapshot {
  return Object.freeze({
    snapshotId: hashProposalIntegrityValue("proposal-snapshot-id", {
      proposalId: proposal.proposalId,
      proposalHash: proposal.proposalHash,
    }),
    proposalId: proposal.proposalId,
    proposalHash: proposal.proposalHash,
    replayHash: proposal.replayHash,
    auditHash: proposal.auditHash,
    governanceSnapshotId: proposal.governanceSnapshotId,
    replaySnapshotId: proposal.replaySnapshotId,
    snapshotHash: hashProposalIntegrityValue("proposal-snapshot", {
      proposalId: proposal.proposalId,
      proposalHash: proposal.proposalHash,
      replayHash: proposal.replayHash,
      auditHash: proposal.auditHash,
    }),
  });
}
