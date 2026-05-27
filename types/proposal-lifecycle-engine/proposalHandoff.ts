export type ProposalHandoffPackage = Readonly<{
  handoffId: string;
  proposalId: string;
  preparedAt: string;
  packageType: "governance_only";
  governanceHash: string;
  replayHash: string;
  snapshotLineageHash: string;
  safeActionHash: string;
  approvalHash: string;
  executionPayloadIncluded: false;
  runtimeInstructionsIncluded: false;
  schedulerMetadataIncluded: false;
  workerMetadataIncluded: false;
  dispatchMetadataIncluded: false;
  payload: Readonly<{
    proposalId: string;
    state: "prepared_handoff";
    missionId: string;
    executionId: string;
    safeActionId: string;
    governanceDecisionHash: string;
    replayReconstructionHash: string;
    snapshotLineageHash: string;
  }>;
}>;
