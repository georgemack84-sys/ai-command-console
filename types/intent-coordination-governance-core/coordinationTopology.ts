import type { CoordinationState } from "./coordinationState";
import type { IntentRelationship } from "./coordinationRelationship";

export type CoordinationTopologyType =
  | "linear"
  | "bounded_tree"
  | "bounded_fanout";

export type IntentCoordinationNode = Readonly<{
  intentId: string;
  proposalId: string;
  state: CoordinationState;
  scopeBindings: readonly string[];
  governanceSnapshotHash: string;
  replayHash: string;
  createdAt: string;
}>;

export type IntentCoordinationTopology = Readonly<{
  topologyId: string;
  topologyType: CoordinationTopologyType;
  rootIntentId: string;
  nodes: readonly IntentCoordinationNode[];
  relationships: readonly IntentRelationship[];
  topologyHash: string;
  lineageHash: string;
  derivedOnly: true;
}>;
