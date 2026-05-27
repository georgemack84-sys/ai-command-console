import type { ConstitutionalCoordinationLineage, ConstitutionalCoordinationLineageEntry } from "@/types/constitutional-coordination";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function appendGovernanceChronology(input: {
  existing?: ConstitutionalCoordinationLineage;
  entry: ConstitutionalCoordinationLineageEntry;
}): ConstitutionalCoordinationLineage {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ].sort((left, right) => {
    const byDate = left.createdAt.localeCompare(right.createdAt);
    return byDate !== 0 ? byDate : left.entryId.localeCompare(right.entryId);
  }));

  return Object.freeze({
    lineageId: input.existing?.lineageId ?? hashContainmentValue("constitutional-coordination-lineage-id", {
      firstEntryId: entries[0]?.entryId ?? "empty",
    }),
    entries,
    lineageHash: hashContainmentValue("constitutional-coordination-lineage", entries),
  });
}
