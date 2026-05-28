import type { RoutingLineage, RoutingLineageEntry } from "@/types/approval-aware-coordination-router";
import { hashRoutingValue } from "./routingHashSerializer";

export function appendRoutingLineage(input: {
  existing?: RoutingLineage;
  entry: RoutingLineageEntry;
}): RoutingLineage {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ].sort((left, right) => {
    const byDate = left.createdAt.localeCompare(right.createdAt);
    return byDate !== 0 ? byDate : left.lineageRecordId.localeCompare(right.lineageRecordId);
  }));

  return Object.freeze({
    lineageId: input.existing?.lineageId ?? hashRoutingValue("approval-aware-routing-lineage-id", {
      firstEntryId: entries[0]?.lineageRecordId ?? "empty",
    }),
    entries,
    lineageHash: hashRoutingValue("approval-aware-routing-lineage", entries),
  });
}
