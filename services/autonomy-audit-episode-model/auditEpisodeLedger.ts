import type { AuditEpisodeLineageEntry, AuditEpisodeLineageLedger } from "@/types/autonomy-audit-episode-model";
import { hashAuditEpisodeValue } from "./auditEpisodeHasher";

export function appendAuditEpisodeLedger(input: {
  existing?: AuditEpisodeLineageLedger;
  episodeId: string;
  episodeHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}): AuditEpisodeLineageLedger {
  const existingEntries = input.existing?.entries ?? [];
  const entry: AuditEpisodeLineageEntry = Object.freeze({
    entryId: hashAuditEpisodeValue("autonomy-audit-ledger-entry-id", {
      episodeId: input.episodeId,
      createdAt: input.createdAt,
    }),
    episodeId: input.episodeId,
    episodeHash: input.episodeHash,
    replayHash: input.replayHash,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });

  return Object.freeze({
    ledgerId: hashAuditEpisodeValue("autonomy-audit-ledger-id", {
      previousLedgerId: input.existing?.ledgerId,
      episodeId: input.episodeId,
      entryCount: existingEntries.length + 1,
    }),
    entries: Object.freeze([...existingEntries, entry]),
    immutable: true,
  });
}
