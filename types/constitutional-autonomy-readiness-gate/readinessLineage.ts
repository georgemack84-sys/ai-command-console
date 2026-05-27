export type ReadinessLineageEntry = Readonly<{
  entryId: string;
  certificationId: string;
  readinessHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}>;

export type ReadinessLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly ReadinessLineageEntry[];
  immutable: true;
}>;
