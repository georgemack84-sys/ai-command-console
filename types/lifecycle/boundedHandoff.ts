export type BoundedHandoffContractRecord = Readonly<{
  handoffId: string;
  proposalId: string;
  lifecycleState: "bounded_handoff";
  governanceSnapshotHash: string;
  replayBindingHash: string;
  lifecycleLineageHash: string;
  executionAuthorized: false;
  orchestrationAuthorized: false;
  schedulingAuthorized: false;
  dispatchAuthorized: false;
  createdAt: string;
  handoffHash: string;
}>;
