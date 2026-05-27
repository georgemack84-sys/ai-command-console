import type { ProposalRevocationError, ProposalRevocationInput } from "./proposalRevocationTypes";

export function validateProposalRevocationDependencies(
  input: ProposalRevocationInput,
): readonly ProposalRevocationError[] {
  const errors: ProposalRevocationError[] = [];
  const expected = input.proposalIntegrityResult.lineageBinding.recommendationLineageHash;
  const declared = input.request.dependencySnapshotId;
  const lineageTail = input.proposalStateEngineResult.lineage.dependencyLineageIds.at(-1);

  if (!declared) {
    errors.push({
      code: "PROPOSAL_REVOCATION_DEPENDENCY_SNAPSHOT_MISSING",
      message: "Revocation requires an explicit dependency snapshot.",
      path: "request.dependencySnapshotId",
    });
  }

  if (declared !== expected || (lineageTail !== undefined && lineageTail !== expected)) {
    errors.push({
      code: "PROPOSAL_REVOCATION_DEPENDENCY_LINEAGE_INCOMPLETE",
      message: "Dependency lineage is incomplete or drifted from immutable proposal ancestry.",
      path: "request.dependencySnapshotId",
    });
  }

  return Object.freeze(errors);
}
