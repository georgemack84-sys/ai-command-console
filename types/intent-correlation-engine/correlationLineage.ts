export interface CorrelationLineageEntry {
  entryId: string;
  resultHash: string;
  replayBindingId: string;
  createdAt: string;
}

export interface CorrelationLineageLedger {
  ledgerId: string;
  entries: readonly CorrelationLineageEntry[];
  immutable: true;
}
