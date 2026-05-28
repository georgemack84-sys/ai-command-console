import { canonicalizeProposalRevocationToString } from "./proposalRevocationCanonicalizer";
import type { ProposalRevocationLineage, ProposalRevocationReplayPolicy, ProposalRevocationRequest, RevocationAuditEntry } from "./proposalRevocationTypes";

export function serializeProposalRevocationRequest(value: ProposalRevocationRequest): string {
  return canonicalizeProposalRevocationToString(value);
}

export function serializeProposalRevocationLineage(value: ProposalRevocationLineage): string {
  return canonicalizeProposalRevocationToString(value);
}

export function serializeProposalRevocationAuditEntry(value: RevocationAuditEntry): string {
  return canonicalizeProposalRevocationToString(value);
}

export function serializeProposalRevocationReplayPolicy(value: ProposalRevocationReplayPolicy): string {
  return canonicalizeProposalRevocationToString(value);
}
