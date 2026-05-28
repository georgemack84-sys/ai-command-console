import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import type { ProposalIntegrityError, ProposalIntegrityLedgerEntry } from "./proposalIntegrityStateTypes";

export function validateProposalIntegrityAuditLedger(
  ledger: readonly ProposalIntegrityLedgerEntry[],
): readonly ProposalIntegrityError[] {
  return verifyImmutableLedgerChain([...ledger])
    ? Object.freeze([])
    : Object.freeze([{
      code: "PROPOSAL_AUDIT_HASH_MISMATCH",
      message: "Proposal audit ledger chain is invalid.",
      path: "auditLedger",
    }]);
}
