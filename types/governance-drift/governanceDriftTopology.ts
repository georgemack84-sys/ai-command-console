export type GovernanceDriftTopologyRecord = Readonly<{
  topologyId: string;
  dependencyLineageId: string;
  topologyFrozen: boolean;
  topologyDriftDetected: boolean;
  topologyHash: string;
}>;
