import type { ProposalIntegrityForensicExport } from "./proposalIntegrityStateTypes";
import { hashProposalAuditValue } from "./proposalAuditHashEngine";

export function exportProposalIntegrityForensics(input: {
  proposalId: string;
  proposalHash: string;
  replayHash: string;
  auditHash: string;
  lineageHash: string;
}): ProposalIntegrityForensicExport {
  return Object.freeze({
    exportId: hashProposalAuditValue("proposal-forensics-id", { proposalId: input.proposalId }),
    proposalId: input.proposalId,
    proposalHash: input.proposalHash,
    replayHash: input.replayHash,
    auditHash: input.auditHash,
    lineageHash: input.lineageHash,
    exportHash: hashProposalAuditValue("proposal-forensics", input),
  });
}
