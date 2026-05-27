import type {
  ConstitutionalAuditLineageEntry,
  ConstitutionalAuditLineageLedger,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

export function appendConstitutionalEpisodeLineage(input: {
  existing?: ConstitutionalAuditLineageLedger;
  entry: ConstitutionalAuditLineageEntry;
}): ConstitutionalAuditLineageLedger {
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
    ledgerId: input.existing?.ledgerId
      ?? hashConstitutionalAuditValue("constitutional-audit-lineage-ledger-id", entries[0]?.entryId ?? "empty"),
    entries,
    lineageHash: hashConstitutionalAuditValue("constitutional-audit-lineage", entries),
  });
}
