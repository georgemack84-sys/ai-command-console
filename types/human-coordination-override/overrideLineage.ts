import type { CoordinationOverrideType, HumanCoordinationOverrideState } from "./overrideStates";

export interface OverrideLineageRecord {
  overrideId: string;
  coordinationId: string;
  overrideType: CoordinationOverrideType;
  initiatedBy: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  reason: string;
  createdAt: string;
}

export type OverrideLineageEntry = Readonly<OverrideLineageRecord & {
  overrideState: HumanCoordinationOverrideState;
  deterministicHash: string;
  replaySafe: boolean;
  failClosed: boolean;
}>;

export type OverrideLineage = Readonly<{
  lineageId: string;
  entries: readonly OverrideLineageEntry[];
  lineageHash: string;
}>;
