export type CoordinationLineageEntry = Readonly<{
  entryId: string;
  coordinationId: string;
  coordinationHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}>;

export type CoordinationLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly CoordinationLineageEntry[];
  immutable: true;
}>;
