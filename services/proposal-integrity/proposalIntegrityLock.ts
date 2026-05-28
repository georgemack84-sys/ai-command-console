import type { SealedProposalRecord } from "./proposalIntegrityStateTypes";
import { hashProposalAuditValue } from "./proposalAuditHashEngine";

export function buildProposalIntegrityLock(record: SealedProposalRecord) {
  return Object.freeze({
    proposalId: record.proposalId,
    immutable: true as const,
    lockHash: hashProposalAuditValue("proposal-integrity-lock", record),
  });
}
