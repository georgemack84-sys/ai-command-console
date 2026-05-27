import type { CoordinationPolicyOutcome } from "../../types/coordination";

export function evaluateCoordinationPolicies(input: {
  enforcementExecutable: boolean;
  containmentRequired: boolean;
  approvalRequired: boolean;
  disputedTruthPresent: boolean;
  sovereigntyState?: string;
  supervisionState?: string;
}) {
  let outcome: CoordinationPolicyOutcome = "ALLOW";
  if (input.disputedTruthPresent) outcome = "FREEZE";
  else if (["COLLAPSING", "EMERGENCY_CONTAINMENT", "CRITICAL"].includes(input.sovereigntyState ?? "")) outcome = "DENY";
  else if (input.containmentRequired) outcome = "CONTAIN";
  else if (!input.enforcementExecutable) outcome = "DENY";
  else if (["BLOCKED", "FROZEN", "DISPUTED", "CONTAINING"].includes(input.supervisionState ?? "")) outcome = "FREEZE";
  else if (input.approvalRequired) outcome = "REQUIRE_APPROVAL";
  return { outcome };
}
