import { appendRecommendationAuditEntry, appendRecommendationLineage } from "@/services/recommendation-synthesis/recommendationAppendOnlyLedger";
import { hashEvidenceValue } from "./evidenceHashEngine";
import type {
  EvidenceAggregationAuditLedgerEntry,
  EvidenceAggregationLineageEntry,
  EvidenceAggregationLineageLedger,
} from "./types/evidenceAggregationTypes";

export function appendEvidenceLineage(input: {
  existing?: EvidenceAggregationLineageLedger;
  entries: readonly EvidenceAggregationLineageEntry[];
}): EvidenceAggregationLineageLedger {
  const mergedEntries = Object.freeze([...(input.existing?.entries ?? []), ...input.entries]);
  const recommendationLedger = appendRecommendationLineage({
    existing: input.existing
      ? {
          entries: input.existing.entries.map((entry) => ({
            entryId: entry.entryId,
            synthesisId: entry.aggregationSessionId,
            recommendationId: entry.evidenceId,
            createdAt: entry.createdAt,
            recommendationHash: entry.deterministicHash,
            deterministicHash: entry.deterministicHash,
          })),
          lineageHash: input.existing.lineageHash,
        }
      : undefined,
    entry: {
      entryId: input.entries[0]?.entryId ?? "evidence-lineage:empty",
      synthesisId: input.entries[0]?.aggregationSessionId ?? "evidence-lineage:empty",
      recommendationId: input.entries[0]?.evidenceId ?? "evidence-lineage:empty",
      createdAt: input.entries[0]?.createdAt ?? "",
      recommendationHash: input.entries[0]?.deterministicHash ?? "",
      deterministicHash: input.entries[0]?.deterministicHash ?? "",
    },
  });
  return Object.freeze({
    entries: mergedEntries,
    lineageHash: hashEvidenceValue("evidence-lineage", {
      mergedEntries,
      inheritedHash: recommendationLedger.lineageHash,
    }),
  });
}

export function appendEvidenceAuditEntry(input: {
  existing?: readonly EvidenceAggregationAuditLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly EvidenceAggregationAuditLedgerEntry[] {
  return appendRecommendationAuditEntry(input);
}
