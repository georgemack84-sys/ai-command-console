export type ConstitutionalGovernanceBinding = Readonly<{
  governanceSnapshotId: string;
  governanceSnapshotHash: string;
  governanceLineageId: string;
  readinessHash: string;
  valid: boolean;
  createdAt: string;
  bindingHash: string;
}>;
