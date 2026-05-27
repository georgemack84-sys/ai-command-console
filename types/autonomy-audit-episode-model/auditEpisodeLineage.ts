export type AuditEpisodeLineageEntry = Readonly<{
  entryId: string;
  episodeId: string;
  episodeHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}>;

export type AuditEpisodeLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly AuditEpisodeLineageEntry[];
  immutable: true;
}>;
