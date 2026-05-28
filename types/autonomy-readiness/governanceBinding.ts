export type GovernanceBinding = Readonly<{
  governanceDecisionHash: string;
  policySnapshotHash: string;
  governanceLineageHash: string;
  approvalLineageHash: string;
  authorityLineageHash: string;
  sourceState: "ALLOW" | "DENY" | "ESCALATE";
  disputed: boolean;
}>;
