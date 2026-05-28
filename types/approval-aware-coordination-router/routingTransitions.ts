export type CoordinationRouteTarget =
  | "governance_review"
  | "approval_review"
  | "escalation_review"
  | "replay_review"
  | "human_review"
  | "coordination_hold";

export type CoordinationRoutingDecision =
  | "route_allowed"
  | "route_blocked"
  | "route_escalated"
  | "route_frozen";
