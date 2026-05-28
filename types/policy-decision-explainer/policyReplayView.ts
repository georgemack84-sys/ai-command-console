export type PolicyReplayView = Readonly<{
  replaySource?: string;
  replayHash?: string;
  replayMismatch: boolean;
  governanceReplayWarnings: readonly string[];
  divergenceFlags: readonly string[];
  unavailable: boolean;
}>;
