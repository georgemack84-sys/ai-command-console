import type { EscalationLineage, EscalationLineageEntry } from "@/types/escalation-aware-coordination";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function appendEscalationLineage(input: {
  existing?: EscalationLineage;
  entry: EscalationLineageEntry;
}): EscalationLineage {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    return left.lineageEntryId.localeCompare(right.lineageEntryId);
  }));

  return Object.freeze({
    lineageId: input.existing?.lineageId ?? hashCoordinationReplayValue("escalation-lineage-id", entries[0]?.lineageEntryId ?? "empty"),
    entries,
    lineageHash: hashCoordinationReplayValue("escalation-lineage", entries),
  });
}
