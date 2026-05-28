export type RecommendationReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type RecommendationIntegrityInspection = Readonly<{
  recommendationId: string;
  coordinationId: string;
  recommendationState: string;
  inspectionHash: string;
}>;

export type RecommendationReplayInspection = Readonly<{
  replayId: string;
  replayDeterministic: boolean;
  replayState: string;
  replayLedgerId: string;
  inspectionHash: string;
}>;

export type GovernanceBindingInspection = Readonly<{
  governanceSnapshotId: string;
  governanceLinked: boolean;
  inspectionHash: string;
}>;

export type ConfidenceIntegrityInspection = Readonly<{
  confidenceLinked: boolean;
  confidenceSafe: boolean;
  inspectionHash: string;
}>;

export type EscalationIntegrityInspection = Readonly<{
  escalationId: string;
  escalationState: string;
  escalationLineageId: string;
  inspectionHash: string;
}>;

export type AuthorityDriftInspection = Readonly<{
  authorityDriftDetected: boolean;
  hiddenOrchestrationDetected: boolean;
  inspectionHash: string;
}>;
