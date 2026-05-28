export type ReadinessGovernanceBinding = Readonly<{
  readinessId: string;
  governanceSnapshotId: string;
  governanceBound: boolean;
  bindingHash: string;
}>;

export type GovernanceReadinessRecord = Readonly<{
  readinessId: string;
  governanceViolationRate: number;
  governanceBound: boolean;
  verificationHash: string;
}>;
