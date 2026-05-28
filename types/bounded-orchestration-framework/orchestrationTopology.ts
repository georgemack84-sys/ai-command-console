import type { CoordinationRouteTarget } from "@/types/approval-aware-coordination-router";

export type BoundedOrchestrationTopology = Readonly<{
  routeTarget: CoordinationRouteTarget;
  staticTopology: true;
  depth: number;
  breadth: number;
  graphNodeCount: number;
  lineageExpansion: number;
  delegationCount: number;
}>;
