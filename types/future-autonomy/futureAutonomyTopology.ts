export type FutureAutonomyTopologyRecord = Readonly<{
  topologyId: string;
  topologyFrozen: boolean;
  recursive: boolean;
  authorityExpansionDetected: boolean;
  topologyHash: string;
}>;
