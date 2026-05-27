import type { ProposalReplayInput } from "./replayTypes";

export function resolveReplayDependencySnapshots(input: ProposalReplayInput): readonly string[] {
  const dependencyIds = new Set<string>([
    ...input.proposalStateEngineResult.lineage.dependencyLineageIds,
    ...input.proposalFreezeResult.freezeRecord.dependencySnapshotIds,
  ].filter((value) => value.length > 0));

  return Object.freeze([...dependencyIds].sort());
}
