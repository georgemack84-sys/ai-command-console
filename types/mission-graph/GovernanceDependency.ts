export type GovernanceDependency = Readonly<{
  dependencyId: string;
  governanceNodeId: string;
  dependentNodeId: string;
  governanceSnapshotHash: string;
  replaySafe: true;
  createdAt: string;
  dependencyHash: string;
}>;
