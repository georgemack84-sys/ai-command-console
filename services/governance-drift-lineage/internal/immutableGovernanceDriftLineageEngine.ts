import type {
  GovernanceDriftLineage,
  GovernanceDriftLineageEntry,
} from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function appendGovernanceDriftLineage(input: {
  existing?: GovernanceDriftLineage;
  entry: GovernanceDriftLineageEntry;
}): GovernanceDriftLineage {
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
      ?? hashGovernanceDriftValue("lineage-id", entries[0]?.entryId ?? "empty"),
    entries,
    lineageHash: hashGovernanceDriftValue("lineage", entries),
  });
}
