export type ProposalRevocation = Readonly<{
  revocationId: string;
  status: "active" | "revoked";
  revokedAt?: string;
  revokedBy: readonly string[];
  reason?: string;
  replayLineageHash: string;
  immutable: true;
}>;
