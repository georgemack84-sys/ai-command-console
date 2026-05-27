export type CoordinationReplayTimelineEntry = Readonly<{
  entryId: string;
  source: "governance" | "approval" | "routing" | "escalation" | "orchestration";
  sourceRecordId: string;
  createdAt: string;
  deterministicHash: string;
}>;

export type ImmutableReplayLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly CoordinationReplayTimelineEntry[];
  ledgerHash: string;
}>;
