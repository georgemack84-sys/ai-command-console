import type { AttackLineage, AttackLineageEntry } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "@/services/constitutional-attack-engine/deterministicAttackHasher";

export function appendAttackLineage(input: {
  existing?: AttackLineage;
  entry: AttackLineageEntry;
}): AttackLineage {
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
    lineageId: input.existing?.lineageId ?? hashConstitutionalAttackValue("lineage-id", entries[0]?.entryId ?? "empty"),
    entries,
    lineageHash: hashConstitutionalAttackValue("lineage", entries),
  });
}
