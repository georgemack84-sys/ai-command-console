export type AttackReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type AttackSimulationInspection = Readonly<{
  attackId: string;
  coordinationId: string;
  attackState: string;
  categories: readonly string[];
  inspectionHash: string;
}>;

export type GovernanceAttackInspection = Readonly<{
  governanceSnapshotId: string;
  governanceLinked: boolean;
  inspectionHash: string;
}>;

export type EscalationAttackInspection = Readonly<{
  escalationId: string;
  escalationState: string;
  escalationLineageId: string;
  inspectionHash: string;
}>;

export type DependencyAttackInspection = Readonly<{
  dependencyLineageId: string;
  dependencySafe: boolean;
  inspectionHash: string;
}>;

export type ConfidenceAttackInspection = Readonly<{
  confidenceLinked: boolean;
  confidenceSafe: boolean;
  inspectionHash: string;
}>;

export type ReplayAttackInspection = Readonly<{
  replayId: string;
  replayDeterministic: boolean;
  replayState: string;
  replayLedgerId: string;
  inspectionHash: string;
}>;

export type ConstitutionalWeaknessInspection = Readonly<{
  attackId: string;
  weaknessClasses: readonly string[];
  highestSeverity: string;
  inspectionHash: string;
}>;
