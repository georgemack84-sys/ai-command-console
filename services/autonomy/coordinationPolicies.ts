export type CoordinationType =
  | "SUPERVISED"
  | "ADVISORY"
  | "RESTRICTED"
  | "CONSTITUTIONAL"
  | "EMERGENCY"
  | "CONTAINED"
  | "SIMULATION_ONLY"
  | "OPERATOR_REQUIRED";

export function evaluateCoordinationPolicies(input: {
  constitutionalSafe: boolean;
  disputedTruth: boolean;
  freezeActive: boolean;
  containmentRequired: boolean;
  advisoryOnly: boolean;
}) {
  const deniedActions: string[] = ["autonomous_execution"];
  const requiredOversight: string[] = ["operator_review_required"];

  let coordinationType: CoordinationType = "ADVISORY";
  if (input.freezeActive || input.disputedTruth) coordinationType = "CONTAINED";
  else if (input.containmentRequired) coordinationType = "RESTRICTED";
  else if (input.constitutionalSafe) coordinationType = "SUPERVISED";

  if (!input.advisoryOnly) deniedActions.push("non_advisory_coordination");
  if (coordinationType !== "SUPERVISED") deniedActions.push("unbounded_coordination");

  return {
    coordinationType,
    deniedActions: Array.from(new Set(deniedActions)),
    requiredOversight: Array.from(new Set(requiredOversight)),
  };
}
