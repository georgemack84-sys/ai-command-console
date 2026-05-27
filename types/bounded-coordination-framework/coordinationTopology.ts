import type { CoordinationCeiling } from "./coordinationCeiling";
import type { CoordinationContainment } from "./coordinationContainment";
import type { CoordinationIsolation } from "./coordinationIsolation";
import type { CoordinationLineageLedger } from "./coordinationLineage";
import type { CoordinationReplayBinding } from "./coordinationReplay";
import type { CoordinationFrameworkError } from "./coordinationErrors";

export type CoordinationTopologyType =
  | "linear"
  | "bounded_tree"
  | "bounded_fanout";

export type CoordinationTopologyNode = Readonly<{
  nodeId: string;
  parentNodeId?: string;
  topologyType: CoordinationTopologyType;
  authorityBoundaryId: string;
  governanceSnapshotId: string;
  replayHash: string;
  createdAt: string;
  delegatedNodeIds: readonly string[];
  escalationDepth: number;
  estimatedDurationMs: number;
}>;

export type CoordinationLineageNode = Readonly<{
  nodeId: string;
  parentNodeId?: string;
  topologyType: string;
  authorityBoundaryId: string;
  governanceSnapshotId: string;
  replayHash: string;
  createdAt: string;
}>;

export type CoordinationTopologyGraph = Readonly<{
  graphId: string;
  topologyType: CoordinationTopologyType;
  rootNodeId: string;
  nodes: readonly CoordinationTopologyNode[];
  graphHash: string;
  lineageHash: string;
  derivedOnly: true;
}>;

export type BoundedCoordinationFrameworkRecord = Readonly<{
  frameworkId: string;
  topology: CoordinationTopologyGraph;
  effectiveCeiling: CoordinationCeiling;
  containment: CoordinationContainment;
  isolation: CoordinationIsolation;
  replayBinding: CoordinationReplayBinding;
  lineage: CoordinationLineageLedger;
  warnings: readonly string[];
  errors: readonly CoordinationFrameworkError[];
  frameworkHash: string;
  derivedOnly: true;
}>;
