export type ReplayVerificationResult = Readonly<{
  replayVerified: boolean;
  replayDeterministic: boolean;
  disputeDetected: boolean;
  verificationHash: string;
}>;
