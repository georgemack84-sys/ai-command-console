import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { SnapshotLineageRecord } from "@/types/mission-graph";
import type { LifecycleComputation } from "@/types/lifecycle";
import { hashMissionGraphValue } from "./graphHasher";

export function reconstructSnapshotLineage(input: {
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
  createdAt: string;
}): readonly SnapshotLineageRecord[] {
  const hashes = Array.from(new Set([
    input.proposal.snapshotBinding.snapshotLineageHash,
    ...input.proposal.snapshotBinding.snapshotLineageHashes,
    input.proposal.replayBinding.snapshotLineageHash,
    input.lifecycle.record.replayBinding.replaySnapshotHash,
  ].filter(Boolean))).sort((left, right) => left.localeCompare(right));
  return Object.freeze(hashes.map((sourceHash) => Object.freeze({
    snapshotId: hashMissionGraphValue("mission-graph-snapshot-lineage", {
      sourceHash,
      createdAt: input.createdAt,
    }),
    sourceHash,
    createdAt: input.createdAt,
  })));
}
