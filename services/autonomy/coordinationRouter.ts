import type { CoordinationType } from "./coordinationPolicies";

export function routeAutonomousCoordination(input: {
  coordinationType: CoordinationType;
  constitutionalSafe: boolean;
  escalationRequired: boolean;
  containmentRequired: boolean;
}) {
  const route = ["governance_review"];
  if (input.containmentRequired || input.coordinationType === "CONTAINED") route.push("containment_precedence");
  if (input.escalationRequired) route.push("escalation_supervision");
  if (!input.constitutionalSafe) route.push("advisory_output_only");
  else route.push("bounded_supervision_only");

  return { route };
}
