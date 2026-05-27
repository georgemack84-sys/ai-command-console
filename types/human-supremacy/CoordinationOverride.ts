export interface CoordinationOverride {
  overrideId: string;
  coordinationId: string;
  overrideType:
    | "proposal"
    | "escalation"
    | "coordination"
    | "replay"
    | "governance"
    | "emergency";
  operatorId: string;
  reason: string;
  timestamp: string;
  replayLineageId: string;
  governanceLineageId: string;
  rationaleSnapshotId: string;
}
