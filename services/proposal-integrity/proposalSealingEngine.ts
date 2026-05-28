import type { OperationalProposal } from "./operationalProposal";
import type { SealedProposalRecord } from "./proposalIntegrityStateTypes";
import type { ProposalIntegrityStatus } from "./proposalIntegrityStatus";
import { hashProposalAuditValue } from "./proposalAuditHashEngine";

export function sealProposal(input: {
  proposal: OperationalProposal;
  createdAt: string;
  status: ProposalIntegrityStatus;
}): SealedProposalRecord {
  const sealedStatus: SealedProposalRecord["status"] =
    input.status === "frozen" || input.status === "revoked" || input.status === "superseded"
      ? input.status
      : input.status === "replay_verified"
        ? "replay_verified"
        : "sealed";

  return Object.freeze({
    proposalId: input.proposal.proposalId,
    proposalHash: input.proposal.proposalHash,
    replayHash: input.proposal.replayHash,
    auditHash: input.proposal.auditHash,
    sealedAt: input.createdAt,
    status: sealedStatus,
    immutable: true as const,
    sealHash: hashProposalAuditValue("proposal-seal", {
      proposalId: input.proposal.proposalId,
      proposalHash: input.proposal.proposalHash,
      replayHash: input.proposal.replayHash,
      auditHash: input.proposal.auditHash,
      status: sealedStatus,
    }),
  });
}
