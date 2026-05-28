import type { ConstitutionalReplayBinding } from "@/types/constitutional-coordination";

export function assembleReplayLineage(binding: ConstitutionalReplayBinding): Readonly<{
  replayLineageId: string;
  replaySnapshotId: string;
}> {
  return Object.freeze({
    replayLineageId: binding.replayLineageId,
    replaySnapshotId: binding.replaySnapshotId,
  });
}
