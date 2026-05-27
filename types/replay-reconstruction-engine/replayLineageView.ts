export type ReplayValidatorBinding = Readonly<{
  validator: string;
  validatorHash: string;
  status: string;
  evidence: readonly string[];
}>;

export type ReplayLineageView = Readonly<{
  treatyId: string;
  replaySnapshotHash: string;
  replayBindingHash: string;
  registrySnapshotHash: string;
  governanceSnapshotHash: string;
  approvalChainHash: string;
  provenanceHash: string;
  treatyEvidenceHash: string;
  validatorBindings: readonly ReplayValidatorBinding[];
  toolContracts: readonly string[];
  dependencyOrder: readonly string[];
  valid: boolean;
}>;
