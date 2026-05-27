export type ReplayBinding = Readonly<{
  replaySnapshotHash: string;
  replayLineageHash: string;
  reconstructionHash: string;
  deterministic: boolean;
  disputed: boolean;
}>;

export type EscalationBinding = Readonly<{
  escalationRequired: boolean;
  escalationRoutes: readonly string[];
  overrideEligible: boolean;
  selfAuthorizationForbidden: true;
}>;
