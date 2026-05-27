import { canonicalizeProposalRevocationToString } from "./proposalRevocationCanonicalizer";
import { hashProposalRevocationValue } from "./proposalRevocationHasher";
import {
  serializeProposalRevocationAuditEntry,
  serializeProposalRevocationLineage,
  serializeProposalRevocationReplayPolicy,
  serializeProposalRevocationRequest,
} from "./proposalRevocationSerializer";
import type { ProposalRevocationError, ProposalRevocationLineage, ProposalRevocationReplayPolicy, ProposalRevocationRequest, RevocationAuditEntry } from "./proposalRevocationTypes";

export function validateProposalRevocationDeterminism(input: {
  request: ProposalRevocationRequest;
  lineage: ProposalRevocationLineage;
  replayPolicy: ProposalRevocationReplayPolicy;
  auditEntries: readonly RevocationAuditEntry[];
}): readonly ProposalRevocationError[] {
  const stable =
    serializeProposalRevocationRequest(input.request) === canonicalizeProposalRevocationToString(input.request)
    && serializeProposalRevocationLineage(input.lineage) === canonicalizeProposalRevocationToString(input.lineage)
    && serializeProposalRevocationReplayPolicy(input.replayPolicy) === canonicalizeProposalRevocationToString(input.replayPolicy)
    && input.auditEntries.every((entry) => serializeProposalRevocationAuditEntry(entry) === canonicalizeProposalRevocationToString(entry));

  if (!stable) {
    return Object.freeze([{
      code: "PROPOSAL_REVOCATION_HASH_MISMATCH",
      message: "Proposal revocation serialization drifted under deterministic validation.",
      path: "determinism",
    }]);
  }

  const hashA = hashProposalRevocationValue("proposal-revocation-determinism", canonicalizeProposalRevocationToString(input));
  const hashB = hashProposalRevocationValue("proposal-revocation-determinism", canonicalizeProposalRevocationToString(JSON.parse(canonicalizeProposalRevocationToString(input))));
  if (hashA !== hashB) {
    return Object.freeze([{
      code: "PROPOSAL_REVOCATION_HASH_MISMATCH",
      message: "Proposal revocation hashing drifted under deterministic validation.",
      path: "determinism",
    }]);
  }

  return Object.freeze([]);
}
