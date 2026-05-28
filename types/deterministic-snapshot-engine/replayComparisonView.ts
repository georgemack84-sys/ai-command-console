export type SnapshotLineageEdge = Readonly<{
  relation:
    | "parent"
    | "branch"
    | "replay"
    | "governance"
    | "authorization"
    | "revocation";
  sourceId: string;
  targetId: string;
  hash: string;
}>;

export type SnapshotLineageView = Readonly<{
  lineageId: string;
  parentSnapshotId?: string;
  branchId?: string;
  replayAncestryHash: string;
  governanceAncestryHash: string;
  authorizationAncestryHash: string;
  revocationAncestryHash: string;
  edges: readonly SnapshotLineageEdge[];
  valid: boolean;
}>;
