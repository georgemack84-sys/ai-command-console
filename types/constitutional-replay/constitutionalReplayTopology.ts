export type ConstitutionalReplayTopologyRecord = Readonly<{
  topologyId: string;
  dependencyLineageId: string;
  topologyFrozen: boolean;
  topologyDriftDetected: boolean;
  topologyHash: string;
}>;
