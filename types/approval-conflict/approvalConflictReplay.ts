export type ApprovalConflictReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type ApprovalConflictInspection = Readonly<{
  conflictId: string;
  coordinationId: string;
  approvalConflictState: string;
  inspectionHash: string;
}>;

export type ApprovalConflictReplayInspection = Readonly<{
  replayId: string;
  replayDeterministic: boolean;
  replayState: string;
  replayLedgerId: string;
  inspectionHash: string;
}>;

export type EscalationConflictInspection = Readonly<{
  escalationId: string;
  escalationState: string;
  escalationLineageId: string;
  inspectionHash: string;
}>;

export type GovernanceConflictInspection = Readonly<{
  governanceSnapshotId: string;
  governanceLinked: boolean;
  inspectionHash: string;
}>;

export type InheritanceConflictInspection = Readonly<{
  inheritanceBlocked: boolean;
  scopeIsolated: boolean;
  inspectionHash: string;
}>;

export type CircularConflictInspection = Readonly<{
  recursiveDetected: boolean;
  graphHash: string;
  inspectionHash: string;
}>;
