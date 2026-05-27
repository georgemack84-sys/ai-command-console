export type ReplayPath = Readonly<{
  pathId: string;
  coordinationId: string;
  nodeIds: readonly string[];
  sourceHashes: readonly string[];
  replaySafe: true;
  historicalOnly: true;
  createdAt: string;
  pathHash: string;
}>;
