import type { CoordinationRoutingDecision, CoordinationRouteTarget } from "./routingTransitions";
import type { RoutingContainmentState } from "./routingContainment";

export type RoutingLineageEntry = Readonly<{
  lineageRecordId: string;
  coordinationId: string;
  proposalId: string;
  decision: CoordinationRoutingDecision;
  target: CoordinationRouteTarget;
  containmentState: RoutingContainmentState;
  blockedReasons: readonly string[];
  createdAt: string;
  deterministicHash: string;
}>;

export type RoutingLineage = Readonly<{
  lineageId: string;
  entries: readonly RoutingLineageEntry[];
  lineageHash: string;
}>;
