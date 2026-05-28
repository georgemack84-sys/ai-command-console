import type { ProposalIntegrityError, ProposalIntegrityInput, ProposalLineageBinding } from "./proposalIntegrityStateTypes";
import { hashProposalIntegrityValue } from "./proposalHashEngine";

export function validateProposalRecommendationLineage(
  input: ProposalIntegrityInput,
): {
  binding: ProposalLineageBinding;
  errors: readonly ProposalIntegrityError[];
} {
  const binding: ProposalLineageBinding = Object.freeze({
    recommendationLineageHash: input.recommendationLineageResult.artifact.lineageHash,
    recommendationSnapshotHash: input.recommendationLineageResult.snapshot.snapshotHash,
    lineageBound: input.recommendationLineageResult.lineage.entries.length > 0,
    deterministicHash: hashProposalIntegrityValue("proposal-lineage-binding", {
      recommendationLineageHash: input.recommendationLineageResult.artifact.lineageHash,
      recommendationSnapshotHash: input.recommendationLineageResult.snapshot.snapshotHash,
    }),
  });
  const errors: ProposalIntegrityError[] = [];
  if (!binding.lineageBound) {
    errors.push({
      code: "PROPOSAL_LINEAGE_HASH_MISMATCH",
      message: "Recommendation lineage binding is incomplete.",
      path: "recommendationLineageHash",
    });
  }
  return Object.freeze({ binding, errors: Object.freeze(errors) });
}
