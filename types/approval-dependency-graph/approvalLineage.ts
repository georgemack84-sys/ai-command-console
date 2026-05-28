export type ApprovalGraphLineageEntry = Readonly<{
  entryId: string;
  proposalId: string;
  graphHash: string;
  replayHash: string;
  lineageHash: string;
  timestamp: string;
}>;

export type ApprovalDependencyLedger = Readonly<{
  ledgerId: string;
  entries: readonly ApprovalGraphLineageEntry[];
  immutable: true;
}>;
