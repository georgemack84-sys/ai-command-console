export type ReplayRevalidationRecord = Readonly<{
  proposalId: string;
  replayIntegrity:
    | "verified"
    | "mismatch"
    | "quarantined";
  lineageConsistent: boolean;
  checkpointValid: boolean;
  replaySafe: boolean;
  reasonCodes: readonly string[];
  revalidationHash: string;
  createdAt: string;
}>;
