export type TelemetryReplayVerification = Readonly<{
  replayStable: boolean;
  replayDeterministic: boolean;
  verificationHash: string;
}>;
