import type { OverrideLineage, OverrideLineageEntry } from "@/types/human-coordination-override";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function appendOverrideLineage(input: {
  existing?: OverrideLineage;
  entry: OverrideLineageEntry;
}): OverrideLineage {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    return left.overrideId.localeCompare(right.overrideId);
  }));

  return Object.freeze({
    lineageId: input.existing?.lineageId ?? hashCoordinationReplayValue("human-override-lineage-id", entries[0]?.overrideId ?? "empty"),
    entries,
    lineageHash: hashCoordinationReplayValue("human-override-lineage", entries),
  });
}
