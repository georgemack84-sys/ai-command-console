export type EscalationAuditRecord = Readonly<{
  auditId: string;
  escalationId: string;
  coordinationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  approvalSnapshotId: string;
  reasons: readonly string[];
  target: string;
  evidenceHash: string;
}>;

export type EscalationReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;
