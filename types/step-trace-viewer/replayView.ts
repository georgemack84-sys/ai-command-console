export type ReplayProjection = Readonly<{
  replaySource: string;
  replayHash: string;
  replayDivergence: boolean;
  stateMismatch: boolean;
  lineageMismatch: boolean;
  warnings: readonly string[];
  projectionHash: string;
}>;
