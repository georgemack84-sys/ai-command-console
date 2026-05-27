export type ConstitutionalEscalationLineageEntry = Readonly<{
  entryId: string;
  escalationId: string;
  escalationHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}>;

export type ConstitutionalEscalationLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly ConstitutionalEscalationLineageEntry[];
  immutable: true;
}>;
