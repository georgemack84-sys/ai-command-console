import type { ApprovalConflictState } from "./approvalConflictStates";

export type ApprovalConflictLineageEntry = Readonly<{
  entryId: string;
  conflictId: string;
  coordinationId: string;
  approvalConflictState: ApprovalConflictState;
  createdAt: string;
  deterministicHash: string;
}>;

export type ApprovalConflictLineage = Readonly<{
  lineageId: string;
  entries: readonly ApprovalConflictLineageEntry[];
  lineageHash: string;
}>;

export type ApprovalConflictLineageGraph = Readonly<{
  graphId: string;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  recursive: boolean;
  graphHash: string;
}>;
