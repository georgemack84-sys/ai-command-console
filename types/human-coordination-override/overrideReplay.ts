export type ReplayVisibilityInspection = Readonly<{
  replayId: string;
  replaySnapshotId: string;
  replayLineageLedgerId: string;
  replayDeterministic: boolean;
  replayState: string;
  inspectionHash: string;
}>;

export type CoordinationLineageInspection = Readonly<{
  coordinationId: string;
  chronologyLineageId: string;
  chronologyEntries: readonly string[];
  coordinationState: string;
  inspectionHash: string;
}>;

export type EscalationRationaleInspection = Readonly<{
  escalationId: string;
  escalationLineageId: string;
  escalationState: string;
  escalationReason: string;
  rationaleCodes: readonly string[];
  inspectionHash: string;
}>;
