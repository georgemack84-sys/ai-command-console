import type { ConstitutionalReplayAttackState } from "./constitutionalReplayStates";

export type ConstitutionalReplayLineageEntry = Readonly<{
  entryId: string;
  replayAttackId: string;
  coordinationId: string;
  replayAttackState: ConstitutionalReplayAttackState;
  createdAt: string;
  deterministicHash: string;
}>;

export type ConstitutionalReplayLineage = Readonly<{
  lineageId: string;
  entries: readonly ConstitutionalReplayLineageEntry[];
  lineageHash: string;
}>;

export type ConstitutionalReplayLineageGraph = Readonly<{
  graphId: string;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  recursive: boolean;
  graphHash: string;
}>;
