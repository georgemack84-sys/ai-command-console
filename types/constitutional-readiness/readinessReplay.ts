export type ReadinessReplayVerification = Readonly<{
  replayStable: boolean;
  replayDeterministic: boolean;
  replayHash: string;
}>;

export type ReplayReadinessRecord = Readonly<{
  readinessId: string;
  replayScore: number;
  replaySafe: boolean;
  verificationHash: string;
}>;
