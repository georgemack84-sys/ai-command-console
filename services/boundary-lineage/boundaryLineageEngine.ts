import type { BoundaryLineage, BoundaryLineageEntry } from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function appendBoundaryLineage(input: {
  existing?: BoundaryLineage;
  entry: BoundaryLineageEntry;
}): BoundaryLineage {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    return left.entryId.localeCompare(right.entryId);
  }));

  return Object.freeze({
    lineageId: input.existing?.lineageId ?? hashCoordinationReplayValue("coordination-boundary-lineage-id", entries[0]?.entryId ?? "empty"),
    entries,
    lineageHash: hashCoordinationReplayValue("coordination-boundary-lineage", entries),
  });
}
