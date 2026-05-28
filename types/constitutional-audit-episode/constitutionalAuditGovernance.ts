export type GovernanceValidationRecord = Readonly<{
  validationId: string;
  governanceSnapshotId: string;
  governanceBound: boolean;
  rationale: string;
  deterministicHash: string;
}>;
