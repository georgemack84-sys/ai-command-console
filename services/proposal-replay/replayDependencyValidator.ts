import { resolveReplayDependencySnapshots } from "./replayDependencySnapshotResolver";
import type { ProposalReplayInput, ProposalReplayError } from "./replayTypes";

export function validateReplayDependencySnapshots(
  input: ProposalReplayInput,
): readonly ProposalReplayError[] {
  const dependencyIds = resolveReplayDependencySnapshots(input);
  if (dependencyIds.length === 0) {
    return Object.freeze([{
      code: "PROPOSAL_REPLAY_DEPENDENCY_SNAPSHOT_MISSING",
      message: "Proposal replay cannot reconstruct immutable dependency lineage without dependency snapshots.",
      path: "proposalStateEngineResult.lineage.dependencyLineageIds",
    } satisfies ProposalReplayError]);
  }

  return Object.freeze([]);
}
