import type {
  FutureAutonomyLineage,
  FutureAutonomyLineageEntry,
} from "@/types/future-autonomy";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

export function appendFutureAutonomyLineage(input: {
  existing?: FutureAutonomyLineage;
  entry: FutureAutonomyLineageEntry;
}): FutureAutonomyLineage {
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
    lineageId: input.existing?.lineageId
      ?? hashFutureAutonomyValue("future-autonomy-lineage-id", entries[0]?.entryId ?? "empty"),
    entries,
    lineageHash: hashFutureAutonomyValue("future-autonomy-lineage", entries),
  });
}
