export interface MissionGraphNode {
  nodeId: string;
  nodeType:
    | "proposal"
    | "approval"
    | "escalation"
    | "governance"
    | "validation"
    | "confidence"
    | "replay"
    | "snapshot"
    | "lifecycle";
  missionId: string;
  createdAt: string;
  replaySafe: true;
  advisoryOnly: true;
  sourceReferenceId: string;
}
