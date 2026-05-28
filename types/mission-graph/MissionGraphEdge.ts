export interface MissionGraphEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType:
    | "depends_on"
    | "triggered_by"
    | "validated_by"
    | "escalated_from"
    | "derived_from"
    | "replayed_from"
    | "supersedes"
    | "snapshot_of";
  replayDeterministic: true;
  createdAt: string;
}
