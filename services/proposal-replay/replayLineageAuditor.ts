import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { hashProposalReplayValue } from "./replayHasher";
import type {
  ProposalReplayError,
  ProposalReplayInput,
  ProposalReplayLineageRecord,
} from "./replayTypes";

export function auditProposalReplayLineage(
  input: ProposalReplayInput,
): {
  lineage: ProposalReplayLineageRecord;
  errors: readonly ProposalReplayError[];
} {
  const errors: ProposalReplayError[] = [];

  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "PROPOSAL_REPLAY_LINEAGE_CORRUPTED",
      message: "Existing proposal replay audit ledger is not append-only valid.",
      path: "existingAuditLedger",
    });
  }

  const stateLineageId = input.proposalStateEngineResult.lineage.lineageId;
  const governanceBindingId = input.proposalGovernanceBindingResult.binding.bindingId;
  const freezeLineageId = input.proposalFreezeResult.lineage.lineageId;
  const revocationLineageId = input.proposalRevocationResult.lineage.revocationId;

  if (!stateLineageId || !governanceBindingId) {
    errors.push({
      code: "PROPOSAL_REPLAY_LINEAGE_CORRUPTED",
      message: "Proposal replay cannot reconstruct immutable lineage ancestry.",
      path: "proposalStateEngineResult.lineage",
    });
  }

  const lineage = Object.freeze({
    proposalId: input.proposalIntegrityResult.proposal.proposalId,
    stateLineageId,
    governanceBindingId,
    freezeLineageId,
    revocationLineageId,
    proposalLineageHash: input.proposalIntegrityResult.lineage.lineageHash,
    replayLineageHash: hashProposalReplayValue("proposal-replay-lineage", {
      stateLineageId,
      governanceBindingId,
      freezeLineageId,
      revocationLineageId,
      proposalLineageHash: input.proposalIntegrityResult.lineage.lineageHash,
      replayBindingHash: input.proposalIntegrityResult.replayBinding.replayHash,
    }),
  });

  return {
    lineage,
    errors: Object.freeze(errors),
  };
}
