export type TriggerLineageEntry = Readonly<{
  entryId: string;
  triggerId: string;
  triggerHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}>;

export type TriggerLineageLedger = Readonly<{
  lineageId: string;
  entries: readonly TriggerLineageEntry[];
  immutable: true;
}>;
