import type { ProposalIntegrityInput, ProposalLineageBinding } from "./proposalIntegrityStateTypes";
import { hashProposalLineageValue } from "./proposalLineageHasher";

export function buildProposalLineageSnapshot(input: {
  integrityInput: ProposalIntegrityInput;
  binding: ProposalLineageBinding;
}) {
  return Object.freeze({
    snapshotId: hashProposalLineageValue({
      proposalId: input.integrityInput.proposalId,
      recommendationLineageHash: input.binding.recommendationLineageHash,
    }),
    recommendationLineageHash: input.binding.recommendationLineageHash,
    recommendationSnapshotHash: input.binding.recommendationSnapshotHash,
    snapshotHash: hashProposalLineageValue(input.binding),
  });
}
