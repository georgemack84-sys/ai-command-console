export type BoundaryReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type OrchestrationBoundaryInspection = Readonly<{
  orchestrationId: string;
  topologyHash: string;
  isolationHash: string;
  containmentState: string;
  ceiling: string;
  inspectionHash: string;
}>;

export type RecursiveWorkflowInspection = Readonly<{
  coordinationId: string;
  recursive: boolean;
  indicators: readonly string[];
  inspectionHash: string;
}>;

export type BoundaryViolationInspection = Readonly<{
  coordinationId: string;
  verdict: string;
  violationTypes: readonly string[];
  inspectionHash: string;
}>;

export type BoundaryEvidenceRecord = Readonly<{
  evidenceId: string;
  boundaryId: string;
  coordinationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  overrideLineageId: string;
  violationCodes: readonly string[];
  evidenceHash: string;
}>;
