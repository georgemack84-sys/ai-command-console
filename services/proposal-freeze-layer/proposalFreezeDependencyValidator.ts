import type { ProposalFreezeError, ProposalFreezeInput } from "./types/proposalFreezeTypes";

export function validateProposalFreezeDependencies(
  input: ProposalFreezeInput,
): readonly ProposalFreezeError[] {
  const errors: ProposalFreezeError[] = [];
  const expectedDependencyLineage = input.proposalIntegrityResult.lineageBinding.recommendationLineageHash;
  const declaredDependencyLineage = input.proposalStateEngineInput.transition.dependencyLineageId;

  if (
    input.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0
    && (!declaredDependencyLineage || declaredDependencyLineage !== expectedDependencyLineage)
  ) {
    errors.push({
      code: "PROPOSAL_FREEZE_DEPENDENCY_CORRUPTION",
      message: "Proposal dependency lineage no longer matches the immutable proposal lineage binding.",
      path: "transition.dependencyLineageId",
    });
  }

  const lineageTail = input.proposalStateEngineResult.lineage.dependencyLineageIds.at(-1);
  if (lineageTail && lineageTail !== expectedDependencyLineage) {
    errors.push({
      code: "PROPOSAL_FREEZE_DEPENDENCY_CORRUPTION",
      message: "Proposal state lineage appended a dependency lineage that diverges from immutable ancestry.",
      path: "proposalStateEngineResult.lineage.dependencyLineageIds",
    });
  }

  return Object.freeze(errors);
}
