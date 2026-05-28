import type {
  ConstitutionalReplayLineage,
  ConstitutionalReplayLineageEntry,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function appendReplayAttackLineage(input: {
  existing?: ConstitutionalReplayLineage;
  entry: ConstitutionalReplayLineageEntry;
}): ConstitutionalReplayLineage {
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
      ?? hashConstitutionalReplayValue("lineage-id", entries[0]?.entryId ?? "empty"),
    entries,
    lineageHash: hashConstitutionalReplayValue("lineage", entries),
  });
}
